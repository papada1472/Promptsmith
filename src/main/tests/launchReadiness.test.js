import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Launch Readiness & Core Loop Validation", () => {
  it("package.json reflects official launch version 2.0.0 and no beta strings", () => {
    const pkgPath = path.resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    expect(pkg.version).toBe("2.0.0");
    expect(pkg.version).not.toContain("beta");
    expect(pkg.description).toContain("Ambient Windows desktop execution layer");
  });

  it("Settings index.html displays Refinzi 2.0 and no user-facing beta tags", () => {
    const settingsHtmlPath = path.resolve(process.cwd(), "src/renderer/settings/index.html");
    const html = fs.readFileSync(settingsHtmlPath, "utf8");
    expect(html).toContain("Refinzi 2.0");
    expect(html).not.toContain("v0.1.0-beta");
    expect(html).not.toContain("BETA FEEDBACK");
    expect(html).toContain("Product Feedback");
  });

  it("Output index.html contains target format selector pills and included usage copy", () => {
    const outputHtmlPath = path.resolve(process.cwd(), "src/renderer/output/index.html");
    const html = fs.readFileSync(outputHtmlPath, "utf8");
    expect(html).toContain("format-toolbar");
    expect(html).toContain("data-format=\"cursor\"");
    expect(html).toContain("data-format=\"claude\"");
    expect(html).toContain("data-format=\"markdown\"");
    expect(html).toContain("included usage");
    expect(html).not.toContain("Beta Limit Reached");
  });

  it("Settings index.html contains desktop dashboard tabs and impact sections", () => {
    const settingsHtmlPath = path.resolve(process.cwd(), "src/renderer/settings/index.html");
    const html = fs.readFileSync(settingsHtmlPath, "utf8");
    expect(html).toContain("data-tab=\"home\"");
    expect(html).toContain("data-tab=\"history\"");
    expect(html).toContain("data-tab=\"blueprints\"");
    expect(html).toContain("data-tab=\"settings\"");
    expect(html).toContain("data-tab=\"upgrade\"");
    expect(html).toContain("Your Impact");
    expect(html).toContain("Recent Activity");
  });
});
