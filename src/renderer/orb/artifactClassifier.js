/**
 * Centralized artifact classifier for drag‑and‑drop payloads.
 *
 * The function inspects the DataTransfer object provided by a drop event
 * and determines whether the payload represents a URL, PDF, Image, or Text.
 * It follows the classification rules defined in the task description:
 *   • URL – text/uri-list present or plain text starting with http:// or https://
 *   • PDF – file with .pdf extension or MIME type application/pdf
 *   • Image – file with .png, .jpg, .jpeg, .webp extensions or MIME type image/*
 *   • Text – plain text (text/plain) that does not match a URL pattern
 *
 * The function returns an object `{ type: "url" | "pdf" | "image" | "text" }`
 * or `null` if the payload cannot be classified.
 */
export function classifyArtifact(dataTransfer) {
    const urlPattern = /^(https?:\/\/)/i;

    // Helper to identify URL subtype
    function getUrlType(url) {
        const trimmed = url.trim();
        if (/youtube\.com|youtu\.be/i.test(trimmed)) {
            return "youtube";
        }
        if (/instagram\.com/i.test(trimmed)) {
            return "instagram";
        }
        return "url";
    }

    // 1️⃣ Check for a URI list – browsers use this for dragged links.
    const uriList = dataTransfer.getData("text/uri-list");
    if (uriList) {
        const trimmed = uriList.trim();
        if (urlPattern.test(trimmed)) {
            return { type: getUrlType(trimmed) };
        }
    }

    // 2️⃣ If files are present, inspect the first file
    if (dataTransfer.files && dataTransfer.files.length > 0) {
        const file = dataTransfer.files[0];
        const name = file.name.toLowerCase();
        const mime = (file.type || "").toLowerCase();

        // CSV detection
        if (name.endsWith('.csv') || mime === 'text/csv') {
            return { type: "csv" };
        }

        // DOCX detection
        if (name.endsWith('.docx') || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            return { type: "docx" };
        }

        // Image detection
        if (/\.(png|jpe?g|webp)$/i.test(name) || mime.startsWith('image/')) {
            return { type: "image" };
        }

        // PDF or Text fallback
        if (name.endsWith('.pdf') || mime === 'application/pdf') {
            return { type: "pdf" };
        }

        return { type: "text" };
    }

    // 3️⃣ Plain text payload (e.g., from clipboard or dragged text)
    const plainText = dataTransfer.getData('text/plain');
    if (plainText) {
        const trimmed = plainText.trim();
        if (urlPattern.test(trimmed)) {
            return { type: getUrlType(trimmed) };
        }
        return { type: "text" };
    }

    return null;
}
