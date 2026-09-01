import fs from "fs";
import path from "path";
import zlib from "zlib";
import dns from "dns/promises";
import net from "net";
import * as pdfParse from "pdf-parse";
import { ProviderManager } from "./ai/ProviderManager.js";
import { store } from "./store.js";
import { metricsService } from "./services/metricsService.js";
import { loggers } from "./logger.js";
import crypto from "crypto";
import { MOTION_LIBRARIES, CREATIVE_THEMES } from "./constants.js";
import { 
  isValidAIResponse, 
  validateRecreationOutput, 
  repairRefineOutput, 
  repairRecreationOutput, 
  repairJsonOutput 
} from "./outputValidator.js";

const log = loggers.artifactAnalyzer;

/**
 * Checks if an IP string belongs to private, loopback, link-local, multicast, or reserved ranges.
 * Supports IPv4, decimal/hex IPs, IPv6, and IPv4-mapped IPv6 addresses.
 */
export function isPrivateOrReservedIP(ipStr) {
  if (!ipStr) return true;
  let normalized = String(ipStr).trim().toLowerCase();

  // Strip IPv4-mapped IPv6 prefix (::ffff:127.0.0.1)
  if (normalized.startsWith("::ffff:")) {
    normalized = normalized.slice(7);
  }

  // Handle IPv4 (dotted decimal or single integer)
  if (net.isIPv4(normalized)) {
    const parts = normalized.split(".").map(Number);
    const ipNum = ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];

    // 127.0.0.0/8 (Loopback)
    if ((ipNum >>> 24) === 127) return true;
    // 10.0.0.0/8 (Private)
    if ((ipNum >>> 24) === 10) return true;
    // 172.16.0.0/12 (Private)
    if ((ipNum >>> 20) === (0xAC10 >>> 4)) return true;
    // 192.168.0.0/16 (Private)
    if ((ipNum >>> 16) === 0xC0A8) return true;
    // 169.254.0.0/16 (Link local / Cloud metadata)
    if ((ipNum >>> 16) === 0xA9FE) return true;
    // 0.0.0.0/8 (Current network)
    if ((ipNum >>> 24) === 0) return true;
    // 100.64.0.0/10 (CGNAT)
    if ((ipNum >>> 22) === (0x6440 >>> 6)) return true;

    return false;
  }

  // Handle IPv6
  if (net.isIPv6(normalized)) {
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true; // fe80::/10 link-local
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 unique local
    return false;
  }

  return true; // Default block if unparseable
}

async function extractTextFromDocx(filePath) {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const targetFile = "word/document.xml";
    let offset = 0;

    while (offset < buffer.length - 30) {
      if (buffer.readUInt32LE(offset) === 0x04034b50) {
        const fileNameLen = buffer.readUInt16LE(offset + 26);
        const extraFieldLen = buffer.readUInt16LE(offset + 28);
        const fileName = buffer.toString("utf8", offset + 30, offset + 30 + fileNameLen);
        
        const compMethod = buffer.readUInt16LE(offset + 8);
        const compSize = buffer.readUInt32LE(offset + 18);
        const dataOffset = offset + 30 + fileNameLen + extraFieldLen;

        if (fileName === targetFile) {
          const compressedData = buffer.slice(dataOffset, dataOffset + compSize);
          let xmlData;
          if (compMethod === 8) {
            // Use async decompression (zlib.promises) to avoid blocking the event
            // loop on large DOCX files — the function is already async.
            xmlData = (await zlib.promises.inflateRaw(compressedData)).toString("utf8");
          } else if (compMethod === 0) {
            xmlData = compressedData.toString("utf8");
          } else {
            throw new Error(`Unsupported compression method: ${compMethod}`);
          }

          const matches = xmlData.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          const text = matches
            .map(match => {
              const inner = match.replace(/<[^>]+>/g, "");
              return inner
                .replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'");
            })
            .join(" ");
          return text;
        }
        offset = dataOffset + compSize;
      } else {
        offset++;
      }
    }
  } catch (e) {
    console.error("[ArtifactAnalyzer] Error extracting docx text:", e);
  }
  return "";
}

/**
 * Fetches title and author metadata from YouTube's oEmbed endpoint.
 */
async function fetchYouTubeMetadata(url) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || "YouTube Video",
        detail: `YouTube Video by ${data.author_name || "Unknown Author"}`
      };
    }
  } catch (e) {
    console.warn("[ArtifactAnalyzer] YouTube oEmbed fetch failed, using fallback:", e.message);
  }
  const videoIdMatch = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : "Unknown ID";
  return {
    title: "YouTube Video",
    detail: `Video ID: ${videoId}`
  };
}

/**
 * Safely fetches HTML metadata from a webpage with DNS pre-resolution, IP validation,
 * manual redirect hop checking, streaming 500KB body limits, and 3s timeout.
 */
export async function fetchUrlMetadata(url, hopCount = 0) {
  if (hopCount > 3) {
    throw new Error("Maximum redirect limit reached");
  }

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Invalid URL scheme");
  }
  if (parsedUrl.port && parsedUrl.port !== "80" && parsedUrl.port !== "443") {
    throw new Error("Disallowed URL port");
  }

  // Pre-resolve DNS and validate all resolved IP addresses
  const resolved = await dns.lookup(parsedUrl.hostname, { all: true });
  if (!resolved || resolved.length === 0) {
    throw new Error("DNS resolution failed");
  }

  for (const addr of resolved) {
    if (isPrivateOrReservedIP(addr.address)) {
      throw new Error("URL points to private/internal IP range");
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "RefinziArtifactIntel/1.0" },
      redirect: "manual",
      signal: controller.signal
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect missing location header");
      const nextUrl = new URL(location, parsedUrl).toString();
      return fetchUrlMetadata(nextUrl, hopCount + 1);
    }

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    // Stream body with 500KB size limit cap
    const reader = response.body.getReader();
    let accumulatedBytes = 0;
    const chunks = [];
    const MAX_BYTES = 500000;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulatedBytes += value.length;
      if (accumulatedBytes > MAX_BYTES) {
        controller.abort();
        throw new Error("Response payload exceeds 500KB size limit");
      }
      chunks.push(value);
    }

    const htmlBuffer = Buffer.concat(chunks);
    const html = htmlBuffer.toString("utf8");

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["']/i) ||
                      html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["']/i) ||
                      html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";

    let bodyText = "";
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      bodyText = bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    return {
      title: title || parsedUrl.hostname,
      detail: description || `Webpage from ${parsedUrl.hostname}`,
      content: bodyText.slice(0, 3000)
    };
  } catch (e) {
    console.warn("[ArtifactAnalyzer] Webpage fetch failed, using fallback:", e.message);
    if (e.message.includes("private/internal") || e.message.includes("scheme") || e.message.includes("port")) {
      throw e; // Re-throw SSRF and security errors
    }
  } finally {
    clearTimeout(timeoutId);
  }

  return {
    title: parsedUrl.hostname,
    detail: `URL: ${url}`,
    content: ""
  };
}


// ── SINGLE PROMPT GENERATION SYSTEM PROMPT ──
// Generates ONE best prompt. No alternatives. No mode selection. Immediate value.
const COMBINED_CREATIVE_PROMPT = `You are a Senior Creative Director at a world-class studio (Buck, Instrument, RESN, Apple).
I am providing you with the deterministic Visual DNA, Motion Blueprint, and Creative Theme for a product.
Your ONLY job is to invent a stunning, cohesive creative concept and implementation prompt around these constraints.

Your output must NOT read like ChatGPT. It must feel like: Senior Creative Director, Buck, Instrument, RESN, Apple.
You should invent. Never analyse. Never summarise. Never explain.
Generate a cinematic creative concept.

You MUST output exactly 5 sections:

### Visual DNA
[Echo and integrate the provided Visual DNA into a compelling narrative context.]

### Creative Concept
[Invent ONE concept name and a 2-sentence pitch based on the theme provided. Unexpected, specific, cinematic.]

### Scroll Story
[Write the story the website tells, mapping the emotional trajectory and rhythm of the pages.]

### Motion Blueprint
[Explain how the provided Motion Library applies to this specific product. Detail the entry animations, hover interactions, and scroll physics.]

### Implementation Prompt
[A concise, ready-to-paste implementation prompt for a developer/Lovable. Include colors, typography, scene architecture, and technical stack.]

RESPOND with valid JSON only:
{
  "visual_dna_echo": "string",
  "creative_concept": "string",
  "scroll_story": ["string"],
  "motion_blueprint": "string",
  "implementation_prompt": "string"
}`;

// ── EXPERT UPGRADE SYSTEM PROMPT ──
// Takes an existing prompt and expands it into a production-ready version.
const EXPERT_UPGRADE_SYSTEM_PROMPT = `You are a Senior Creative Director at a world-class studio (Buck, Instrument, RESN, Apple).

You receive an existing AI prompt that was generated from an artifact drop.

YOUR JOB:
Expand this prompt into a production-ready, implementation-grade version.

Your output must NOT read like ChatGPT. It must feel like: Senior Creative Director, Buck, Instrument, RESN, Apple.
You should invent. Never analyse. Never summarise. Never explain the image.
Generate a cinematic creative concept.

RULES:
- Preserve the original intent completely. Do not change what the user wants to build.
- Add: edge cases, error handling requirements, styling precision, technical specifications.
- Add: implementation constraints, performance considerations, accessibility requirements.
- Add: production-readiness criteria (responsive design, browser support, etc.) if relevant.
- Return ONLY the upgraded prompt text. No JSON. No explanation. No preamble.`;

/**
 * Parses an artifact payload and extracts content, type, and metadata.
 */
async function parseArtifact(data) {
  let content = data.text || "";
  let type = data.type || "text";
  let title = data.name || "Text Snippet";
  let detail = `${content.length} characters`;
  let media = null;

  if (data.path) {
    const ext = path.extname(data.path).toLowerCase();
    const stats = await fs.promises.stat(data.path);
    const sizeStr = `${(stats.size / 1024).toFixed(1)} KB`;

    if (ext === ".csv") {
      type = "csv";
      const fileContent = await fs.promises.readFile(data.path, "utf8");
      const lines = fileContent.split(/\r?\n/).filter(l => l.trim());
      const rows = lines.length > 0 ? lines.length - 1 : 0;
      const headers = lines.length > 0 ? lines[0].split(",").map(h => h.trim()) : [];
      content = fileContent;
      title = path.basename(data.path);
      detail = `CSV • ${rows} rows • ${headers.length} columns • ${sizeStr}`;
    } else if (ext === ".docx") {
      type = "docx";
      const fileContent = await extractTextFromDocx(data.path);
      content = fileContent;
      const wordCount = fileContent.split(/\s+/).filter(Boolean).length;
      title = path.basename(data.path);
      detail = `DOCX • ${wordCount} words • ${sizeStr}`;
    } else if (ext === ".pdf") {
      type = "pdf";
      try {
        const pdfBuffer = await fs.promises.readFile(data.path);
        const pdfData = await pdfParse(pdfBuffer);
        content = pdfData.text || "";
        const pageCount = pdfData.numpages || 1;
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        title = path.basename(data.path);
        detail = `PDF • ${pageCount} pages • ${wordCount} words • ${sizeStr}`;
      } catch (e) {
        log.error("[ArtifactAnalyzer] PDF parsing failed:", e);
        content = "PDF (text extraction failed)";
        title = path.basename(data.path);
        detail = `PDF • ${sizeStr}`;
      }
    } else if (/\.(png|jpe?g|webp)$/i.test(data.path)) {
      type = "image";
      content = "Image drop";
      const imgBuffer = await fs.promises.readFile(data.path);
      media = {
        mimeType: ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg",
        data: imgBuffer.toString("base64")
      };
      title = path.basename(data.path);
      detail = `Image • ${sizeStr}`;
    } else {
      try {
        const buf = await fs.promises.readFile(data.path, "utf8");
        content = buf.slice(0, 5000);
        title = path.basename(data.path);
        detail = `File • ${sizeStr}`;
      } catch (e) {
        content = "Binary or unreadable file";
        title = path.basename(data.path);
        detail = `File • ${sizeStr}`;
      }
    }
  } else if (content) {
    const urlPattern = /^(https?:\/\/[^\s]+)$/i;
    const trimmed = content.trim();
    if (urlPattern.test(trimmed)) {
      const url = trimmed;
      if (/youtube\.com|youtu\.be/i.test(url)) {
        type = "youtube";
        const ytMeta = await fetchYouTubeMetadata(url);
        title = ytMeta.title;
        detail = ytMeta.detail;
        content = `YouTube video link: ${url}. Title: ${ytMeta.title}`;
      } else if (/instagram\.com/i.test(url)) {
        type = "instagram";
        const match = url.match(/(?:p|reel)\/([a-zA-Z0-9_-]+)/);
        const postId = match ? match[1] : "Unknown ID";
        title = "Instagram Post";
        detail = `Instagram Reel/Post ID: ${postId}`;
        content = `Instagram post link: ${url}`;
      } else {
        type = "url";
        const webMeta = await fetchUrlMetadata(url);
        title = webMeta.title;
        detail = webMeta.detail;
        content = `Webpage URL: ${url}. Title: ${webMeta.title}. Snippet: ${webMeta.content}`;
      }
    } else {
      type = "text";
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      title = "Text Snippet";
      detail = `Text • ${wordCount} words • ${content.length} characters`;
    }
  }

  return { type, content, title, detail, media };
}

/**
 * Safe JSON parsing of AI output, handling potential markdown wrapper.
 */
function parseJsonResponse(text, userPrompt = "") {
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (inner) {
        console.error("Failed to parse extracted JSON block:", inner);
      }
    }
    log.info("[ArtifactAnalyzer] JSON parsing failed. Repairing output from markdown sections.");
    return repairJsonOutput(text, userPrompt);
  }
}

/**
 * Deterministically extracts DNA and selects Theme and Motion based on hash.
 */
function deterministicExtract(parsed) {
  const hashInput = `${parsed.type}|${parsed.title}|${parsed.content.slice(0, 5000)}|${parsed.media ? parsed.media.data.slice(0, 5000) : ''}`;
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
  const numericHash = parseInt(hash.slice(0, 8), 16);

  // Theme and motion are BOTH derived deterministically from the hash —
  // so a cache hit always returns the same (theme, DNA, motion) triple.
  const themeIndex = numericHash % CREATIVE_THEMES.length;
  const theme = CREATIVE_THEMES[themeIndex];
  const motionIndex = numericHash % MOTION_LIBRARIES.length;

  const cachedDna = store.get(`dnaCache.${hash}`);
  let visualDna, motion;

  if (cachedDna) {
    log.info(`[ArtifactAnalyzer] Found cached Visual DNA for hash ${hash.slice(0,8)}`);
    visualDna = cachedDna.visualDna;
    motion = cachedDna.motion;
  } else {
    log.info(`[ArtifactAnalyzer] Generating new deterministic DNA for hash ${hash.slice(0,8)}`);
    visualDna = `Artifact type: ${parsed.type}. Name: ${parsed.title}. Content length: ${parsed.content.length} chars. Base theme constraint: ${theme.name}.`;
    motion = MOTION_LIBRARIES[motionIndex];

    // Cap the dnaCache at 100 entries to prevent unbounded store growth.
    const allKeys = store.store ? Object.keys(store.store) : [];
    const dnaCacheKeys = allKeys.filter(k => k.startsWith('dnaCache.'));
    if (dnaCacheKeys.length >= 100) {
      log.info(`[ArtifactAnalyzer] dnaCache limit reached (${dnaCacheKeys.length}), evicting all entries.`);
      dnaCacheKeys.forEach(k => store.delete(k));
    }

    store.set(`dnaCache.${hash}`, { visualDna, motion });
  }

  return { visualDna, motion, theme, hash };
}

/**
 * Executes a step with automatic provider failover orchestration and health checking.
 */
/**
 * Main prompt generation function.
 * Parses the artifact, fetches deterministic DNA, calls AI (ONE call), validates output.
 */
export async function generatePromptAngles(data) {
  log.info("[TRACE_DROP] generatePromptAngles — starting prompt generation");
  const parsed = await parseArtifact(data);
  log.info(`[ArtifactAnalyzer] Generating design direction for ${parsed.type}: ${parsed.title}`);

  const { visualDna, motion, theme, hash } = deterministicExtract(parsed);
  log.info(`[ArtifactAnalyzer] Applied Motion: ${motion.name} | Theme: ${theme.name}`);

  const userPrompt = `ARTIFACT CONTEXT:
Type: ${parsed.type}
Title: ${parsed.title}

DETERMINISTIC VISUAL DNA:
${visualDna}

MOTION LIBRARY:
Name: ${motion.name}
Curves: ${motion.curves}
Description: ${motion.description}

CREATIVE THEME:
Name: ${theme.name}
Style: ${theme.style}`;

  let stepOpts = { responseMimeType: "application/json" };
  if (parsed.media) stepOpts.media = parsed.media;

  try {
    const { output } = await ProviderManager.refineWithFailover(userPrompt, {
      mode: "drop",
      systemPrompt: COMBINED_CREATIVE_PROMPT,
      responseMimeType: "application/json",
      media: parsed.media,
      timeoutMs: 45000
    });

    const result = parseJsonResponse(output, userPrompt);
    
    let finalPrompt = `### Visual DNA
${result.visual_dna_echo || ''}

### Creative Concept
${result.creative_concept || ''}

### Scroll Story
${(result.scroll_story || []).join('\n')}

### Motion Blueprint
${result.motion_blueprint || ''}

### Implementation Prompt
${result.implementation_prompt || ''}`.trim();

    const validation = isValidAIResponse(userPrompt, finalPrompt);
    if (!validation.valid) {
      finalPrompt = repairRefineOutput(userPrompt, finalPrompt, validation.reason);
    }
    const recVal = validateRecreationOutput(finalPrompt);
    if (!recVal.valid) {
      finalPrompt = repairRecreationOutput(finalPrompt, recVal.forbidden, recVal.missing);
    }

    return {
      id: hash.substring(0, 8),
      title: result.creative_concept?.split('\n')[0] || "Creative Concept",
      prompt: finalPrompt,
      color: "#1A1A1A", 
      badge: theme.name,
      _artifactContext: {
        type: parsed.type,
        title: parsed.title,
        detail: parsed.detail,
        content: parsed.content,
        media: parsed.media
      }
    };
  } catch (err) {
    log.error("[ArtifactAnalyzer] All providers failed, using fallback:", err);
    return ruleBasedFallback(parsed.type, parsed.title, parsed.content);
  }
}

/**
 * Expert upgrade: takes an existing generated prompt and expands it into
 * a production-ready, implementation-grade version.
 * This is called AFTER the user sees the initial prompt — zero pre-generation friction.
 */
export async function upgradeToExpertPrompt(existingPrompt, artifactContext) {
  console.log("[ArtifactAnalyzer] Upgrading prompt to production-ready version");

  const contextNote = artifactContext
    ? `\n\nOriginal artifact context: ${artifactContext.type} — "${artifactContext.title}"`
    : "";

  const userPrompt = `ORIGINAL PROMPT:\n"""\n${existingPrompt}\n"""${contextNote}\n\nExpand this into a production-ready, implementation-grade version.`;

  try {
    const { output } = await ProviderManager.refineWithFailover(userPrompt, {
      mode: "expert",
      systemPrompt: EXPERT_UPGRADE_SYSTEM_PROMPT,
      timeoutMs: 12000
    });
    return {
      prompt: output.trim(),
      ok: true
    };
  } catch (err) {
    console.error("[ArtifactAnalyzer] Expert upgrade failed:", err);
    return {
      prompt: existingPrompt,
      ok: false,
      error: err.message
    };
  }
}

/**
 * Rule-based fallback for when the API is unavailable.
 */
function ruleBasedFallback(type, title, content) {
  const snippet = (content || "").slice(0, 150).replace(/\n/g, " ").trim();
  const ref = snippet ? ` Based on its content: "${snippet}..."` : "";

  return {
    id: "fallback",
    title,
    prompt: `Analyze "${title}" and identify the most important patterns, claims, and actionable takeaways. Recreate or adapt the core structure for immediate use.${ref}`,
    color: "#1A1A1A",
    badge: "Offline",
    artifactType: type,
    _artifactContext: {
      type,
      title,
      detail: "",
      content: content || "",
      media: null
    }
  };
}
