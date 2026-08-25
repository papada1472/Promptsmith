/**
 * Centralized artifact classifier for drag‑and‑drop payloads.
 *
 * The function inspects the DataTransfer object provided by a drop event
 * and determines whether the payload represents a URL, PDF, Image, CSV,
 * DOCX, or Text artifact.
 *
 * NOTE: The type returned here is a renderer-side HINT used for immediate
 * UI feedback (icons, labels). The authoritative type is always re-derived
 * by parseArtifact() in the main process — from file extension for file drops,
 * and from URL pattern matching for link drops.
 *
 * Classification priority:
 *   1. URI list (dragged link) → url / youtube / instagram / tiktok
 *   2. File → csv / docx / image / pdf / text (by extension + MIME)
 *   3. Plain text → url subtype or text
 *   Returns null if payload cannot be classified.
 */
export function classifyArtifact(dataTransfer) {
    console.log("[TRACE_DROP][HOP 4: ~] classifyArtifact — inspecting DataTransfer object");
    const urlPattern = /^(https?:\/\/)/i;

    /**
     * Maps a URL string to its specific subtype.
     * Covers: youtube, youtube shorts (→ reel), instagram, tiktok, generic url.
     */
    function getUrlType(url) {
        const trimmed = url.trim();
        if (/youtube\.com|youtu\.be/i.test(trimmed)) {
            // YouTube Shorts are treated as reels
            if (/\/shorts\//i.test(trimmed)) return "reel";
            return "youtube";
        }
        if (/instagram\.com/i.test(trimmed)) return "instagram";
        if (/tiktok\.com/i.test(trimmed)) return "reel";
        return "url";
    }

    // 1️⃣ Check for a URI list – browsers use this for dragged links.
    console.log("[TRACE_DROP][HOP 4: PASS] classifyArtifact — executing type detection");
    const uriList = dataTransfer.getData("text/uri-list");
    if (uriList) {
        const trimmed = uriList.trim();
        if (urlPattern.test(trimmed)) {
            return { type: getUrlType(trimmed) };
        }
    }

    // 2️⃣ If files are present, inspect the first file by extension + MIME.
    // Order matters: more specific types checked before generic fallbacks.
    if (dataTransfer.files && dataTransfer.files.length > 0) {
        const file = dataTransfer.files[0];
        const name = file.name.toLowerCase();
        const mime = (file.type || "").toLowerCase();

        if (name.endsWith(".csv") || mime === "text/csv") {
            return { type: "csv" };
        }

        if (
            name.endsWith(".docx") ||
            mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            return { type: "docx" };
        }

        if (/\.(png|jpe?g|webp)$/i.test(name) || mime.startsWith("image/")) {
            return { type: "image" };
        }

        if (name.endsWith(".pdf") || mime === "application/pdf") {
            return { type: "pdf" };
        }

        // Any other file — main process will read as UTF-8 text (first 5 000 chars)
        return { type: "text" };
    }

    // 3️⃣ Plain text payload (clipboard paste or text drag)
    const plainText = dataTransfer.getData("text/plain");
    if (plainText) {
        const trimmed = plainText.trim();
        if (urlPattern.test(trimmed)) {
            return { type: getUrlType(trimmed) };
        }
        return { type: "text" };
    }

    return null;
}
