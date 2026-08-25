import { describe, it, expect } from "vitest";
import { isPrivateOrReservedIP, fetchUrlMetadata } from "../artifactAnalyzer.js";

describe("SSRF & DNS Rebinding Security Guard", () => {
  describe("isPrivateOrReservedIP", () => {
    it("identifies IPv4 loopback (127.0.0.1)", () => {
      expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("127.0.0.254")).toBe(true);
    });

    it("identifies private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)", () => {
      expect(isPrivateOrReservedIP("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("172.16.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIP("192.168.1.1")).toBe(true);
    });

    it("identifies cloud metadata / link local IPv4 (169.254.169.254)", () => {
      expect(isPrivateOrReservedIP("169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIP("169.254.0.1")).toBe(true);
    });

    it("identifies IPv6 loopback and link-local (::1, fe80::)", () => {
      expect(isPrivateOrReservedIP("::1")).toBe(true);
      expect(isPrivateOrReservedIP("::")).toBe(true);
      expect(isPrivateOrReservedIP("fe80::1")).toBe(true);
      expect(isPrivateOrReservedIP("fc00::1")).toBe(true);
    });

    it("identifies IPv4-mapped IPv6 addresses (::ffff:127.0.0.1)", () => {
      expect(isPrivateOrReservedIP("::ffff:127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("::ffff:10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("::ffff:192.168.1.1")).toBe(true);
    });

    it("allows public IPv4 addresses", () => {
      expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIP("1.1.1.1")).toBe(false);
      expect(isPrivateOrReservedIP("140.82.121.4")).toBe(false);
    });
  });

  describe("fetchUrlMetadata security restrictions", () => {
    it("rejects non-HTTP/HTTPS schemes", async () => {
      await expect(fetchUrlMetadata("file:///etc/passwd")).rejects.toThrow("Invalid URL scheme");
      await expect(fetchUrlMetadata("gopher://127.0.0.1")).rejects.toThrow("Invalid URL scheme");
      await expect(fetchUrlMetadata("javascript:alert(1)")).rejects.toThrow("Invalid URL scheme");
    });

    it("rejects disallowed non-standard ports", async () => {
      await expect(fetchUrlMetadata("http://example.com:22")).rejects.toThrow("Disallowed URL port");
      await expect(fetchUrlMetadata("http://example.com:6379")).rejects.toThrow("Disallowed URL port");
    });

    it("rejects loopback and localhost URLs", async () => {
      await expect(fetchUrlMetadata("http://127.0.0.1")).rejects.toThrow("URL points to private/internal IP range");
      await expect(fetchUrlMetadata("http://localhost")).rejects.toThrow("URL points to private/internal IP range");
    });
  });
});
