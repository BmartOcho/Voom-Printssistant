/**
 * Token Storage Service
 * Securely stores and retrieves OAuth tokens
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { TokenData } from "./canva-auth.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export interface StoredTokenData extends TokenData {
  createdAt: number;
  lastRefreshedAt: number;
}

/**
 * Token Storage Manager
 */
export class TokenStorage {
  private tokensFile: string;
  private encryptionKey: Buffer;

  constructor(dataDir: string, encryptionKey: string) {
    this.tokensFile = path.join(dataDir, "tokens.encrypted.json");
    
    // Derive a 32-byte key from the encryption key
    this.encryptionKey = crypto
      .createHash("sha256")
      .update(encryptionKey)
      .digest();
    
    // Ensure the data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Encrypt data
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    return iv.toString("hex") + authTag.toString("hex") + encrypted;
  }

  /**
   * Decrypt data
   */
  private decrypt(encryptedData: string): string {
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), "hex");
    const authTag = Buffer.from(
      encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
      "hex"
    );
    const encrypted = encryptedData.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Load all tokens from disk
   */
  private loadTokens(): Record<string, StoredTokenData> {
    if (!fs.existsSync(this.tokensFile)) {
      return {};
    }

    try {
      const encryptedContent = fs.readFileSync(this.tokensFile, "utf8");
      const decrypted = this.decrypt(encryptedContent);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Failed to load tokens:", error);
      return {};
    }
  }

  /**
   * Save all tokens to disk
   */
  private saveTokens(tokens: Record<string, StoredTokenData>): void {
    try {
      const json = JSON.stringify(tokens, null, 2);
      const encrypted = this.encrypt(json);
      fs.writeFileSync(this.tokensFile, encrypted, "utf8");
    } catch (error) {
      console.error("Failed to save tokens:", error);
      throw new Error("Failed to save tokens");
    }
  }

  /**
   * Store token data for a user
   */
  storeToken(userId: string, tokenData: TokenData): void {
    const tokens = this.loadTokens();
    
    tokens[userId] = {
      ...tokenData,
      createdAt: Date.now(),
      lastRefreshedAt: Date.now(),
    };

    this.saveTokens(tokens);
  }

  /**
   * Get token data for a user
   */
  getToken(userId: string): StoredTokenData | null {
    const tokens = this.loadTokens();
    return tokens[userId] || null;
  }

  /**
   * Update token data (e.g., after refresh)
   */
  updateToken(userId: string, tokenData: Partial<TokenData>): void {
    const tokens = this.loadTokens();
    const existing = tokens[userId];

    if (!existing) {
      throw new Error(`No token found for user ${userId}`);
    }

    tokens[userId] = {
      ...existing,
      ...tokenData,
      lastRefreshedAt: Date.now(),
    };

    this.saveTokens(tokens);
  }

  /**
   * Delete token for a user
   */
  deleteToken(userId: string): void {
    const tokens = this.loadTokens();
    delete tokens[userId];
    this.saveTokens(tokens);
  }

  /**
   * Check if user has a stored token
   */
  hasToken(userId: string): boolean {
    const tokens = this.loadTokens();
    return userId in tokens;
  }

  /**
   * Get all user IDs with stored tokens
   */
  listUsers(): string[] {
    const tokens = this.loadTokens();
    return Object.keys(tokens);
  }
}
