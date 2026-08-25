import { describe, it, expect } from "vitest";
import { classifyArtifact } from "../../renderer/orb/artifactClassifier.js";

describe("Orb Artifact Classifier", () => {
  function createMockDataTransfer({ text = "", uriList = "", files = [] } = {}) {
    return {
      getData(type) {
        if (type === "text/uri-list") return uriList;
        if (type === "text/plain") return text;
        return "";
      },
      files
    };
  }

  describe("URI-list drops", () => {
    it("classifies generic URLs as url", () => {
      const dt = createMockDataTransfer({ uriList: "https://stripe.com/pricing" });
      expect(classifyArtifact(dt)).toEqual({ type: "url" });
    });

    it("classifies YouTube URLs as youtube", () => {
      const dt = createMockDataTransfer({ uriList: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
      expect(classifyArtifact(dt)).toEqual({ type: "youtube" });
    });

    it("classifies YouTube Shorts as reel", () => {
      const dt = createMockDataTransfer({ uriList: "https://www.youtube.com/shorts/abc123xyz" });
      expect(classifyArtifact(dt)).toEqual({ type: "reel" });
    });

    it("classifies Instagram links as instagram", () => {
      const dt = createMockDataTransfer({ uriList: "https://www.instagram.com/p/Cxyz123/" });
      expect(classifyArtifact(dt)).toEqual({ type: "instagram" });
    });

    it("classifies TikTok links as reel", () => {
      const dt = createMockDataTransfer({ uriList: "https://www.tiktok.com/@user/video/123456" });
      expect(classifyArtifact(dt)).toEqual({ type: "reel" });
    });
  });

  describe("File drops", () => {
    it("classifies .pdf files as pdf", () => {
      const dt = createMockDataTransfer({ files: [{ name: "annual_report.pdf", type: "application/pdf" }] });
      expect(classifyArtifact(dt)).toEqual({ type: "pdf" });
    });

    it("classifies .docx files as docx", () => {
      const dt = createMockDataTransfer({ files: [{ name: "spec.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }] });
      expect(classifyArtifact(dt)).toEqual({ type: "docx" });
    });

    it("classifies .csv files as csv", () => {
      const dt = createMockDataTransfer({ files: [{ name: "data.csv", type: "text/csv" }] });
      expect(classifyArtifact(dt)).toEqual({ type: "csv" });
    });

    it("classifies image files (.png, .jpg) as image", () => {
      const dtPng = createMockDataTransfer({ files: [{ name: "hero.png", type: "image/png" }] });
      expect(classifyArtifact(dtPng)).toEqual({ type: "image" });

      const dtJpg = createMockDataTransfer({ files: [{ name: "photo.jpg", type: "image/jpeg" }] });
      expect(classifyArtifact(dtJpg)).toEqual({ type: "image" });
    });

    it("classifies other files as text", () => {
      const dt = createMockDataTransfer({ files: [{ name: "notes.txt", type: "text/plain" }] });
      expect(classifyArtifact(dt)).toEqual({ type: "text" });
    });
  });

  describe("Plain text drops", () => {
    it("classifies plain text URLs properly", () => {
      const dt = createMockDataTransfer({ text: "https://news.ycombinator.com" });
      expect(classifyArtifact(dt)).toEqual({ type: "url" });
    });

    it("classifies general text snippet as text", () => {
      const dt = createMockDataTransfer({ text: "Create a modern landing page for a SaaS app" });
      expect(classifyArtifact(dt)).toEqual({ type: "text" });
    });

    it("returns null for empty DataTransfer", () => {
      const dt = createMockDataTransfer();
      expect(classifyArtifact(dt)).toBeNull();
    });
  });
});
