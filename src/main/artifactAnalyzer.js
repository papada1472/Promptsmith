import fs from "fs";
import path from "path";
import zlib from "zlib";
import { ProviderManager } from "./ai/ProviderManager.js";
import { store } from "./store.js";

/**
 * Extracts raw paragraph text from a .docx file without external npm dependencies.
 */
function extractTextFromDocx(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
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
            xmlData = zlib.inflateRawSync(compressedData).toString("utf8");
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
 * Fetches HTML title, description meta, and body text from a webpage.
 */
async function fetchUrlMetadata(url) {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "RefinziArtifactIntel/1.0" },
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      const html = await response.text();
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

      const parsedUrl = new URL(url);
      return {
        title: title || parsedUrl.hostname,
        detail: description || `Webpage from ${parsedUrl.hostname}`,
        content: bodyText.slice(0, 3000)
      };
    }
  } catch (e) {
    console.warn("[ArtifactAnalyzer] Webpage fetch failed, using fallback:", e.message);
  }
  const parsedUrl = new URL(url);
  return {
    title: parsedUrl.hostname,
    detail: `URL: ${url}`,
    content: ""
  };
}

// ── SINGLE PROMPT GENERATION SYSTEM PROMPT ──
// Generates ONE best prompt. No alternatives. No mode selection. Immediate value.
const PROMPT_GENERATION_SYSTEM_PROMPT = `You are Refinzi's prompt engine.

You receive an artifact — a URL, text, CSV, document, screenshot, image, YouTube link, or other file.

YOUR JOB:
Generate exactly ONE highly specific recreation/action prompt based on the artifact.

RULES:
- Infer the user's most likely goal. Why did they drop this into a prompt generator?
- Reference specific details from the artifact (names, numbers, phrases, features, design elements).
- A prompt that works without having seen the specific artifact has FAILED.
- Prompts must be 4–10 sentences. Complete enough to paste into any AI and get a useful result.
- Do NOT use generic MBA phrases ("provide actionable insights", "analyze the competitive landscape").
- Do NOT add preamble, explanations, or commentary.

RESPOND with valid JSON only:
{
  "artifactType": "type of artifact (e.g. website, screenshot, pdf, csv, video, text, ui-mockup)",
  "prompt": "the single best prompt text, 4-10 sentences, highly specific to the artifact content"
}

No markdown. No code blocks. Raw JSON only.`;

// ── EXPERT UPGRADE SYSTEM PROMPT ──
// Takes an existing prompt and expands it into a production-ready version.
const EXPERT_UPGRADE_SYSTEM_PROMPT = `You are Refinzi's expert upgrade engine.

You receive an existing AI prompt that was generated from an artifact drop.

YOUR JOB:
Expand this prompt into a production-ready, implementation-grade version.

RULES:
- Preserve the original intent completely. Do not change what the user wants to build.
- Add: edge cases, error handling requirements, styling precision, technical specifications.
- Add: implementation constraints, performance considerations, accessibility requirements.
- Add: production-readiness criteria (responsive design, browser support, etc.) if relevant.
- Add: explicit output structure and success criteria.
- Keep it actionable and specific — not generic advice.
- Do NOT add fluff or MBA buzzwords.
- Return ONLY the upgraded prompt text. No JSON. No explanation. No preamble.`;

/**
 * Creates an AI provider instance using the user's configured API keys.
 */
function createProvider(systemPrompt, timeoutMs = 10000) {
  const activeProvider = store.get("activeProvider") || "gemini";
  const apiKey = store.get(activeProvider === "openrouter" ? "openRouterApiKey" : "geminiApiKey");
  const activeModel = store.get("activeModel") || ProviderManager.getDefaultModel(activeProvider);
  const providerId = ProviderManager.getActiveProviderId({ 
    activeProvider,
    geminiApiKey: store.get("geminiApiKey"),
    openRouterApiKey: store.get("openRouterApiKey")
  });

  return ProviderManager.createProvider(providerId, {
    apiKey: providerId === "gateway" ? undefined : apiKey,
    model: activeModel,
    systemPrompt,
    timeoutMs
  });
}

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
    const stats = fs.statSync(data.path);
    const sizeStr = `${(stats.size / 1024).toFixed(1)} KB`;

    if (ext === ".csv") {
      type = "csv";
      const fileContent = fs.readFileSync(data.path, "utf8");
      const lines = fileContent.split(/\r?\n/).filter(l => l.trim());
      const rows = lines.length > 0 ? lines.length - 1 : 0;
      const headers = lines.length > 0 ? lines[0].split(",").map(h => h.trim()) : [];
      content = fileContent;
      title = path.basename(data.path);
      detail = `CSV • ${rows} rows • ${headers.length} columns • ${sizeStr}`;
    } else if (ext === ".docx") {
      type = "docx";
      const fileContent = extractTextFromDocx(data.path);
      content = fileContent;
      const wordCount = fileContent.split(/\s+/).filter(Boolean).length;
      title = path.basename(data.path);
      detail = `DOCX • ${wordCount} words • ${sizeStr}`;
    } else if (/\.(png|jpe?g|webp)$/i.test(data.path)) {
      type = "image";
      content = "Image drop";
      const imgBuffer = fs.readFileSync(data.path);
      media = {
        mimeType: ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg",
        data: imgBuffer.toString("base64")
      };
      title = path.basename(data.path);
      detail = `Image • ${sizeStr}`;
    } else {
      try {
        content = fs.readFileSync(data.path, "utf8").slice(0, 5000);
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
function parseJsonResponse(text) {
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
    throw e;
  }
}

/**
 * Main prompt generation function.
 * Parses the artifact, calls AI, returns a single best prompt immediately.
 * No mode selection. No alternatives. Immediate value.
 */
export async function generatePromptAngles(data) {
  const parsed = await parseArtifact(data);
  console.log(`[ArtifactAnalyzer] Generating single best prompt for ${parsed.type}: ${parsed.title}`);

  const provider = createProvider(PROMPT_GENERATION_SYSTEM_PROMPT, 10000);

  const contentSlice = parsed.type === "image"
    ? "[Image provided via multimodal input]"
    : parsed.content.slice(0, 4000);

  const userPrompt = `ARTIFACT\nType: ${parsed.type}\nName: ${parsed.title}\nContext: ${parsed.detail}\n\nARTIFACT CONTENT (reference specific details from this in your prompt):\n"""\n${contentSlice}\n"""\n\nGenerate the single best action prompt for this artifact.`;

  try {
    const opts = { responseMimeType: "application/json" };
    if (parsed.media) {
      opts.media = parsed.media;
    }
    const response = await provider.refine(userPrompt, opts);
    const result = parseJsonResponse(response);

    const prompt = result.prompt || `Analyze "${parsed.title}" and identify the most important patterns, claims, and actionable takeaways based on its content.`;
    const artifactType = result.artifactType || parsed.type;

    return {
      prompt,
      artifactType,
      title: parsed.title,
      detail: parsed.detail,
      // Store artifact context for expert upgrade
      _artifactContext: {
        type: artifactType,
        title: parsed.title,
        detail: parsed.detail,
        content: parsed.content,
        media: parsed.media
      }
    };
  } catch (err) {
    console.error("[ArtifactAnalyzer] Prompt generation failed, using fallback:", err);
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

  const provider = createProvider(EXPERT_UPGRADE_SYSTEM_PROMPT, 12000);

  const contextNote = artifactContext
    ? `\n\nOriginal artifact context: ${artifactContext.type} — "${artifactContext.title}"`
    : "";

  const userPrompt = `ORIGINAL PROMPT:\n"""\n${existingPrompt}\n"""${contextNote}\n\nExpand this into a production-ready, implementation-grade version.`;

  try {
    const expertPrompt = await provider.refine(userPrompt);
    return {
      prompt: expertPrompt.trim(),
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
    prompt: `Analyze "${title}" and identify the most important patterns, claims, and actionable takeaways. Recreate or adapt the core structure for immediate use.${ref}`,
    artifactType: type,
    title,
    detail: "",
    _artifactContext: {
      type,
      title,
      detail: "",
      content: content || "",
      media: null
    }
  };
}
