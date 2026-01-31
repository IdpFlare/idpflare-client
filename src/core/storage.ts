/**
 * Token Storage Abstraction
 * Supports localStorage, sessionStorage, and in-memory storage
 */

import type { TokenData, TokenResponse } from "./types";

/**
 * Storage keys used by the client
 */
export interface StorageKeys {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: string;
  scope: string;
  codeVerifier: string;
  state: string;
  nonce: string;
}

/**
 * Create storage keys with a prefix
 */
export function createStorageKeys(prefix: string): StorageKeys {
  return {
    accessToken: `${prefix}_access_token`,
    refreshToken: `${prefix}_refresh_token`,
    idToken: `${prefix}_id_token`,
    expiresAt: `${prefix}_expires_at`,
    scope: `${prefix}_scope`,
    codeVerifier: `${prefix}_code_verifier`,
    state: `${prefix}_state`,
    nonce: `${prefix}_nonce`,
  };
}

/**
 * Storage interface that works with different storage mechanisms
 */
export interface ITokenStorage {
  getTokens(): TokenData;
  storeTokens(response: TokenResponse): void;
  clearTokens(): void;
  getAuthFlowData(): { codeVerifier: string | null; state: string | null; nonce: string | null };
  storeAuthFlowData(data: { codeVerifier: string; state: string; nonce?: string }): void;
  clearAuthFlowData(): void;
}

/**
 * In-memory storage implementation
 */
class MemoryStorage implements Storage {
  private data: Map<string, string> = new Map();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

/**
 * Token storage implementation
 */
export class TokenStorage implements ITokenStorage {
  private storage: Storage;
  private keys: StorageKeys;

  constructor(
    storageType: "localStorage" | "sessionStorage" | "memory" = "localStorage",
    keyPrefix: string = "idpflare"
  ) {
    this.keys = createStorageKeys(keyPrefix);

    if (storageType === "memory") {
      this.storage = new MemoryStorage();
    } else if (storageType === "sessionStorage") {
      this.storage = typeof window !== "undefined" ? window.sessionStorage : new MemoryStorage();
    } else {
      this.storage = typeof window !== "undefined" ? window.localStorage : new MemoryStorage();
    }
  }

  /**
   * Get all stored tokens
   */
  getTokens(): TokenData {
    const expiresAtStr = this.storage.getItem(this.keys.expiresAt);
    return {
      accessToken: this.storage.getItem(this.keys.accessToken),
      refreshToken: this.storage.getItem(this.keys.refreshToken),
      idToken: this.storage.getItem(this.keys.idToken),
      expiresAt: expiresAtStr ? parseInt(expiresAtStr, 10) : null,
      scope: this.storage.getItem(this.keys.scope),
    };
  }

  /**
   * Store tokens from a token response
   */
  storeTokens(response: TokenResponse): void {
    this.storage.setItem(this.keys.accessToken, response.access_token);
    
    if (response.refresh_token) {
      this.storage.setItem(this.keys.refreshToken, response.refresh_token);
    }
    
    if (response.id_token) {
      this.storage.setItem(this.keys.idToken, response.id_token);
    }
    
    if (response.scope) {
      this.storage.setItem(this.keys.scope, response.scope);
    }

    const expiresAt = Date.now() + response.expires_in * 1000;
    this.storage.setItem(this.keys.expiresAt, expiresAt.toString());
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    this.storage.removeItem(this.keys.accessToken);
    this.storage.removeItem(this.keys.refreshToken);
    this.storage.removeItem(this.keys.idToken);
    this.storage.removeItem(this.keys.expiresAt);
    this.storage.removeItem(this.keys.scope);
  }

  /**
   * Get stored auth flow data (for callback handling)
   */
  getAuthFlowData(): { codeVerifier: string | null; state: string | null; nonce: string | null } {
    return {
      codeVerifier: this.storage.getItem(this.keys.codeVerifier),
      state: this.storage.getItem(this.keys.state),
      nonce: this.storage.getItem(this.keys.nonce),
    };
  }

  /**
   * Store auth flow data before redirect
   */
  storeAuthFlowData(data: { codeVerifier: string; state: string; nonce?: string }): void {
    this.storage.setItem(this.keys.codeVerifier, data.codeVerifier);
    this.storage.setItem(this.keys.state, data.state);
    if (data.nonce) {
      this.storage.setItem(this.keys.nonce, data.nonce);
    }
  }

  /**
   * Clear auth flow data after callback
   */
  clearAuthFlowData(): void {
    this.storage.removeItem(this.keys.codeVerifier);
    this.storage.removeItem(this.keys.state);
    this.storage.removeItem(this.keys.nonce);
  }
}

