/**
 * Simple test harness for the artifact classifier.
 * Runs a series of mock DataTransfer objects through classifyArtifact
 * and prints the classification result to the console.
 */
import { classifyArtifact } from "../src/renderer/orb/artifactClassifier.js";

// Helper to create a mock DataTransfer compatible with the classifier.
class MockDataTransfer {
    /**
     * @param {Object} opts
     * @param {string} [opts.uriList]
     * @param {string} [opts.plainText]
     * @param {Array<{name:string,type:string}>} [opts.files]
     */
    constructor({ uriList = "", plainText = "", files = [] } = {}) {
        this._uriList = uriList;
        this._plainText = plainText;
        // The classifier expects a FileList-like object with a length and index access.
        this.files = files;
    }
    getData(type) {
        if (type === "text/uri-list") return this._uriList;
        if (type === "text/plain") return this._plainText;
        return "";
    }
}

function testCase(description, dataTransfer, expected) {
    const result = classifyArtifact(dataTransfer);
    const passed = result && result.type === expected ? "PASS" : "FAIL";
    console.log(`${description}: ${passed}`);
    if (!passed) {
        console.log("  Expected:", expected, "Got:", result ? result.type : null);
    }
}

// URL via uri-list
testCase(
    "URL via uri-list",
    new MockDataTransfer({ uriList: "https://example.com" }),
    "url"
);

// URL via plain text
testCase(
    "URL via plain text",
    new MockDataTransfer({ plainText: "http://example.org" }),
    "url"
);

// PDF file
testCase(
    "PDF file",
    new MockDataTransfer({ files: [{ name: "doc.pdf", type: "application/pdf" }] }),
    "pdf"
);

// Image file (png)
testCase(
    "Image file (png)",
    new MockDataTransfer({ files: [{ name: "photo.png", type: "image/png" }] }),
    "image"
);

// Text plain
testCase(
    "Plain text",
    new MockDataTransfer({ plainText: "Just some random text" }),
    "text"
);

// Unknown payload (should return null)
const unknown = classifyArtifact(new MockDataTransfer({}));
console.log("Unknown payload returns null:", unknown === null ? "PASS" : "FAIL");
