/**
 * clipboardReliability.test.js
 *
 * Tests clipboard flow reliability — using the pure outputValidator module
 * which has zero native dependencies. No mocking needed.
 */

import { describe, it, expect } from "vitest";
import { isValidAIResponse } from "../outputValidator.js";

describe("isValidAIResponse", () => {
  it("returns valid for a clearly improved response", () => {
    const result = isValidAIResponse(
      "write email",
      "Compose a professional email to the recipient, ensuring a clear subject line and concise body."
    );
    expect(result.valid).toBe(true);
  });

  it("returns invalid for empty output", () => {
    expect(isValidAIResponse("hello", "").valid).toBe(false);
    expect(isValidAIResponse("hello", "   ").valid).toBe(false);
  });

  it("returns invalid when output equals input", () => {
    const text = "write a LinkedIn post";
    expect(isValidAIResponse(text, text).valid).toBe(false);
  });

  it("returns invalid for error-prefixed responses", () => {
    const errorPhrases = [
      "Error: something went wrong",
      "error",
      "API Error: 500",
      "Failed:",
      "failed",
      "Timeout: request expired",
    ];
    for (const phrase of errorPhrases) {
      expect(isValidAIResponse("input", phrase).valid).toBe(false);
    }
  });

  it("returns invalid for known error strings", () => {
    expect(isValidAIResponse("input", "unable to process right now").valid).toBe(false);
    expect(isValidAIResponse("input", "daily refinement quota reached").valid).toBe(false);
    expect(isValidAIResponse("input", "no api key configured").valid).toBe(false);
    expect(isValidAIResponse("input", "rate limit exceeded").valid).toBe(false);
    expect(isValidAIResponse("input", "too many requests").valid).toBe(false);
    expect(isValidAIResponse("input", "model is overloaded").valid).toBe(false);
    expect(isValidAIResponse("input", "blocked by safety filtering").valid).toBe(false);
    expect(isValidAIResponse("input", "content policy violation").valid).toBe(false);
  });

  it("includes a reason field on failure", () => {
    const result = isValidAIResponse("x", "");
    expect(result.valid).toBe(false);
    expect(typeof result.reason).toBe("string");
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it("handles case insensitive error detection", () => {
    expect(isValidAIResponse("input", "ERROR: something broke").valid).toBe(false);
    expect(isValidAIResponse("input", "Api Error: 500").valid).toBe(false);
    expect(isValidAIResponse("input", "FAILED: task").valid).toBe(false);
  });

  it("passes valid responses", () => {
    const validOutputs = [
      "Write a professional email about project updates",
      "Create a React component for a user profile card",
      "Analyze this CSV data for revenue trends",
      "Refactor this function to be async",
    ];
    for (const output of validOutputs) {
      expect(isValidAIResponse("original input", output).valid).toBe(true);
    }
  });
});