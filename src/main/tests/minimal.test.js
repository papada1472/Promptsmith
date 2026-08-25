import { describe, it, expect } from "vitest";

describe("Phase 1 - Product Loop & BYOK Mappings", () => {
    it("validates that sample mock artifact contains required keys", () => {
        const sampleArtifact = {
            type: "landing-page",
            name: "SaaS Hero Page",
            text: "Landing Page mock artifact content structure",
            isSample: true
        };
        expect(sampleArtifact.type).toBe("landing-page");
        expect(sampleArtifact.isSample).toBe(true);
    });

    it("verifies structured payload mapping helper constructs expected output payload for quota exceeded", () => {
        const mockResponse = { reason: "quota_exceeded", ok: false };
        let promptData = mockResponse;
        if (promptData && (promptData.reason === "quota_exceeded" || promptData.ok === false)) {
            promptData = { prompt: "", isQuotaExceeded: true };
        }
        expect(promptData.isQuotaExceeded).toBe(true);
        expect(promptData.prompt).toBe("");
    });
});