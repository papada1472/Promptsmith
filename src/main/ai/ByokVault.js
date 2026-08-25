import electron from "electron";
import { createLogger } from "../logger.js";

const log = createLogger("ByokVault");

const safeStorage = electron?.safeStorage || (electron && electron.default && electron.default.safeStorage);

// Detect test environment early
const __isVitest = typeof process !== "undefined" &&
  !process.versions?.electron &&
  (process.env.VITEST || process.env.NODE_ENV === "test");

export class ByokVault {
  /**
   * Encrypts a string using safeStorage.
   * Fails closed if safeStorage is unavailable — NEVER returns plaintext API keys.
   * @param {string} value 
   * @returns {string} Base64 encoded encrypted string.
   */
  static encrypt(value) {
    if (!value) return "";
    if (__isVitest) return value; // Skip encryption in tests

    if (!safeStorage || typeof safeStorage.isEncryptionAvailable !== "function" || !safeStorage.isEncryptionAvailable()) {
      log.error("[ByokVault] safeStorage unavailable on system.");
      const err = new Error("System credential vault (safeStorage) is unavailable on this OS environment. API keys cannot be saved to disk securely.");
      err.code = "SAFESTORAGE_UNAVAILABLE";
      throw err;
    }

    try {
      const encrypted = safeStorage.encryptString(value);
      return encrypted.toString("base64");
    } catch (err) {
      log.error("[ByokVault] safeStorage encryption failed:", err.message || err);
      const vaultErr = new Error("Credential encryption failed. Key was not saved.");
      vaultErr.code = "ENCRYPTION_FAILED";
      throw vaultErr;
    }
  }

  /**
   * Decrypts a base64 encoded encrypted string using safeStorage.
   * Fails closed if safeStorage is unavailable or buffer is corrupt.
   * @param {string} encryptedValue 
   * @returns {string} Decrypted raw string.
   */
  static decrypt(encryptedValue) {
    if (!encryptedValue) return "";
    if (__isVitest) return encryptedValue; // Skip decryption in tests

    if (!safeStorage || typeof safeStorage.isEncryptionAvailable !== "function" || !safeStorage.isEncryptionAvailable()) {
      log.warn("[ByokVault] safeStorage unavailable during decryption.");
      return "";
    }

    try {
      const buffer = Buffer.from(encryptedValue, "base64");
      return safeStorage.decryptString(buffer);
    } catch (err) {
      log.error("[ByokVault] Decryption failed:", err.message || err);
      return "";
    }
  }
}
