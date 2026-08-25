import { describe, it, expect, vi } from "vitest";
import { ByokVault } from "../ai/ByokVault.js";

describe("ByokVault Fail-Closed Security Guard", () => {
  it("returns empty string when encrypting empty value", () => {
    expect(ByokVault.encrypt("")).toBe("");
    expect(ByokVault.encrypt(null)).toBe("");
  });

  it("returns empty string when decrypting empty value", () => {
    expect(ByokVault.decrypt("")).toBe("");
    expect(ByokVault.decrypt(null)).toBe("");
  });
});
