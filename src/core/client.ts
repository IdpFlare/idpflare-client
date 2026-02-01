/**
 * IDPFlare Client
 * Main client class for OAuth 2.0 / OpenID Connect interactions
 */

import { generatePKCEPair, generateState, generateNonce } from "./pkce";
import { TokenStorage } from "./storage";
import { IdPFlareApi } from "./api";
import type {
  IdPFlareConfig,
  TokenData,
  TokenResponse,
  UserInfo,
  IdTokenClaims,
  DiscoveryDocument,
  AuthenticationResult,
  CallbackResult,
  LoginRequest,
  IdPFlareEventType,
  IdPFlareEventHandler,
  IdPFlareEvent,
  AccountInfo,
} from "./types";

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<IdPFlareConfig> = {
  scopes: ["openid", "profile", "email"],
  autoRefresh: true,
  refreshBuffer: 60,
  storage: "localStorage",
  storageKeyPrefix: "idpflare",
};

/**
 * Main IDPFlare client class
 * Handles OAuth 2.0 authorization code flow with PKCE
 */
export class IdPFlareClient {
  private config: Required<Omit<IdPFlareConfig, "postLogoutRedirectUri">> & Pick<IdPFlareConfig, "postLogoutRedirectUri">;
  private storage: TokenStorage;
  private discoveryDocument: DiscoveryDocument | null = null;
  private eventHandlers: Map<IdPFlareEventType, Set<IdPFlareEventHandler>> = new Map();
  private refreshPromise: Promise<boolean> | null = null;
  private callbackInProgress = false;
  private _api: IdPFlareApi | null = null;

  constructor(config: IdPFlareConfig) {
    // Merge with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      scopes: config.scopes ?? DEFAULT_CONFIG.scopes!,
      autoRefresh: config.autoRefresh ?? DEFAULT_CONFIG.autoRefresh!,
      refreshBuffer: config.refreshBuffer ?? DEFAULT_CONFIG.refreshBuffer!,
      storage: config.storage ?? DEFAULT_CONFIG.storage!,
      storageKeyPrefix: config.storageKeyPrefix ?? DEFAULT_CONFIG.storageKeyPrefix!,
    };

    // Initialize storage
    this.storage = new TokenStorage(this.config.storage, this.config.storageKeyPrefix);
  }

  // ==========================================================================
  // API ACCESS (for custom UIs)
  // ==========================================================================

  /**
   * Get the API client for direct authentication
   * 
   * Use this for building custom login, registration, and password reset UIs
   * instead of using the OAuth redirect flow.
   * 
   * @example
   * ```typescript
   * // Register a new user
   * const result = await client.api.register({
   *   email: 'user@example.com',
   *   password: 'securePassword',
   * });
   * 
   * // Login with credentials
   * const loginResult = await client.api.loginWithCredentials({
   *   email: 'user@example.com',
   *   password: 'securePassword',
   * });
   * ```
   */
  get api(): IdPFlareApi {
    if (!this._api) {
      this._api = new IdPFlareApi(this.config.authority);
    }
    return this._api;
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Check if user is currently authenticated
   * Returns true if a valid (non-expired) access token exists
   */
  isAuthenticated(): boolean {
    const { accessToken, expiresAt } = this.storage.getTokens();
    if (!accessToken || !expiresAt) {
      return false;
    }
    // Check with buffer to allow for network latency
    return Date.now() < expiresAt - this.config.refreshBuffer * 1000;
  }

  /**
   * Get the current account info if authenticated
   */
  getAccount(): AccountInfo | null {
    if (!this.isAuthenticated()) {
      return null;
    }

    const claims = this.getIdTokenClaims();
    if (!claims) {
      return null;
    }

    return {
      id: claims.sub,
      email: claims.email,
      name: claims.name,
      idTokenClaims: claims,
    };
  }

  /**
   * Get all stored tokens
   */
  getTokens(): TokenData {
    return this.storage.getTokens();
  }

  /**
   * Get the current access token
   * Returns null if not authenticated or token is expired
   */
  getAccessToken(): string | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.storage.getTokens().accessToken;
  }

  /**
   * Get a valid access token, refreshing if necessary
   * This is the recommended method for making API calls
   */
  async getAccessTokenSilent(): Promise<string | null> {
    const tokens = this.storage.getTokens();

    // If token is still valid, return it
    if (tokens.accessToken && tokens.expiresAt && Date.now() < tokens.expiresAt - this.config.refreshBuffer * 1000) {
      return tokens.accessToken;
    }

    // Try to refresh
    if (tokens.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.storage.getTokens().accessToken;
      }
    }

    return null;
  }

  /**
   * Parse and return ID token claims
   */
  getIdTokenClaims(): IdTokenClaims | null {
    const { idToken } = this.storage.getTokens();
    if (!idToken) {
      return null;
    }

    try {
      const payload = idToken.split(".")[1];
      const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded) as IdTokenClaims;
    } catch {
      return null;
    }
  }

  /**
   * Fetch user info from the userinfo endpoint
   */
  async getUserInfo(): Promise<UserInfo | null> {
    const accessToken = await this.getAccessTokenSilent();
    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch(`${this.config.authority}/oauth/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token might be revoked, try to refresh
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            return this.getUserInfo();
          }
        }
        return null;
      }

      return (await response.json()) as UserInfo;
    } catch {
      return null;
    }
  }

  /**
   * Start the login flow
   * Redirects the user to the authorization endpoint
   */
  async login(request?: LoginRequest): Promise<void> {
    this.emitEvent("loginStart");

    // Generate PKCE pair
    const { codeVerifier, codeChallenge } = await generatePKCEPair();
    const state = request?.state ?? generateState();
    const nonce = generateNonce();

    // Store for callback
    this.storage.storeAuthFlowData({ codeVerifier, state, nonce });

    // Merge scopes
    const scopes = [...new Set([...this.config.scopes, ...(request?.scopes ?? [])])];

    // Build authorization URL
    const authUrl = new URL(`${this.config.authority}/oauth/authorize`);
    authUrl.searchParams.set("client_id", this.config.clientId);
    authUrl.searchParams.set("redirect_uri", this.config.redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("nonce", nonce);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    if (request?.prompt) {
      authUrl.searchParams.set("prompt", request.prompt);
    }

    if (request?.loginHint) {
      authUrl.searchParams.set("login_hint", request.loginHint);
    }

    // Add any extra query params
    if (request?.extraQueryParams) {
      for (const [key, value] of Object.entries(request.extraQueryParams)) {
        authUrl.searchParams.set(key, value);
      }
    }

    // Redirect to IdP
    window.location.href = authUrl.toString();
  }

  /**
   * Handle the OAuth callback
   * Call this on your redirect URI page
   */
  async handleCallback(url?: string): Promise<CallbackResult> {
    // Prevent double-processing (e.g., React StrictMode)
    if (this.callbackInProgress) {
      // Wait and check if tokens were stored
      await new Promise((resolve) => setTimeout(resolve, 100));
      const existingTokens = this.storage.getTokens();
      if (existingTokens.accessToken) {
        return { success: true };
      }
      return { success: true };
    }

    // Check if we already have tokens
    const existingTokens = this.storage.getTokens();
    if (existingTokens.accessToken) {
      return { success: true };
    }

    // Parse URL params
    const searchParams = new URLSearchParams(url ?? window.location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle error from IdP
    if (error) {
      this.emitEvent("loginError", { error, errorDescription });
      return { success: false, error, errorDescription: errorDescription ?? undefined };
    }

    // Validate params
    if (!code || !state) {
      const msg = "Missing code or state parameter";
      this.emitEvent("loginError", { error: msg });
      return { success: false, error: msg };
    }

    // Verify state
    const { state: storedState, codeVerifier, nonce } = this.storage.getAuthFlowData();
    if (!storedState) {
      const msg = "Invalid state parameter - session expired";
      this.emitEvent("loginError", { error: msg });
      return { success: false, error: msg };
    }

    if (state !== storedState) {
      const msg = "Invalid state parameter";
      this.emitEvent("loginError", { error: msg });
      return { success: false, error: msg };
    }

    if (!codeVerifier) {
      const msg = "Missing code verifier";
      this.emitEvent("loginError", { error: msg });
      return { success: false, error: msg };
    }

    // Mark as in progress
    this.callbackInProgress = true;

    try {
      // Exchange code for tokens
      const response = await fetch(`${this.config.authority}/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: this.config.clientId,
          code,
          redirect_uri: this.config.redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as Record<string, string>).error_description ??
          (errorData as Record<string, string>).error ??
          "Token exchange failed";
        this.callbackInProgress = false;
        this.emitEvent("loginError", { error: errorMsg });
        return { success: false, error: errorMsg };
      }

      const tokens = (await response.json()) as TokenResponse;
      this.storage.storeTokens(tokens);

      // Validate ID token nonce if present
      if (tokens.id_token && nonce) {
        const claims = this.getIdTokenClaims();
        if (claims?.nonce !== nonce) {
          this.storage.clearTokens();
          this.callbackInProgress = false;
          const msg = "Invalid nonce in ID token";
          this.emitEvent("loginError", { error: msg });
          return { success: false, error: msg };
        }
      }

      // Clean up
      this.storage.clearAuthFlowData();
      this.callbackInProgress = false;

      const result: AuthenticationResult = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope ?? this.config.scopes.join(" "),
        idTokenClaims: this.getIdTokenClaims() ?? undefined,
      };

      this.emitEvent("loginSuccess", result);
      return { success: true, result };
    } catch (err) {
      this.callbackInProgress = false;
      const errorMsg = String(err);
      this.emitEvent("loginError", { error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    // Dedupe concurrent refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const { refreshToken } = this.storage.getTokens();
    if (!refreshToken) {
      return false;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.config.authority}/oauth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: this.config.clientId,
            refresh_token: refreshToken,
          }),
        });

        if (!response.ok) {
          this.storage.clearTokens();
          this.emitEvent("tokenRefreshError");
          this.emitEvent("sessionExpired");
          return false;
        }

        const tokens = (await response.json()) as TokenResponse;
        this.storage.storeTokens(tokens);
        this.emitEvent("tokenRefresh");
        return true;
      } catch {
        this.storage.clearTokens();
        this.emitEvent("tokenRefreshError");
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Log out the user
   * Clears local tokens and optionally redirects to the IdP logout endpoint
   */
  logout(options?: { redirect?: boolean }): void {
    this.emitEvent("logoutStart");

    const { idToken } = this.storage.getTokens();
    this.storage.clearTokens();

    const shouldRedirect = options?.redirect ?? true;

    if (shouldRedirect) {
      const logoutUrl = new URL(`${this.config.authority}/oauth/logout`);
      const postLogoutUri = this.config.postLogoutRedirectUri ?? window.location.origin;
      logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutUri);

      if (idToken) {
        logoutUrl.searchParams.set("id_token_hint", idToken);
      }

      this.emitEvent("logoutComplete");
      window.location.href = logoutUrl.toString();
    } else {
      this.emitEvent("logoutComplete");
    }
  }

  /**
   * Revoke the current access token
   */
  async revokeToken(): Promise<void> {
    const { accessToken } = this.storage.getTokens();
    if (!accessToken) {
      return;
    }

    try {
      await fetch(`${this.config.authority}/oauth/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          token: accessToken,
          token_type_hint: "access_token",
        }),
      });
    } catch {
      // Revocation failure is typically ignored
    }
  }

  // ==========================================================================
  // DISCOVERY
  // ==========================================================================

  /**
   * Fetch the OIDC discovery document
   */
  async getDiscoveryDocument(): Promise<DiscoveryDocument | null> {
    if (this.discoveryDocument) {
      return this.discoveryDocument;
    }

    try {
      const response = await fetch(`${this.config.authority}/.well-known/openid-configuration`);
      if (!response.ok) {
        return null;
      }
      this.discoveryDocument = (await response.json()) as DiscoveryDocument;
      return this.discoveryDocument;
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  /**
   * Subscribe to client events
   */
  on(event: IdPFlareEventType, handler: IdPFlareEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from client events
   */
  off(event: IdPFlareEventType, handler: IdPFlareEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Emit an event to all subscribers
   */
  private emitEvent(type: IdPFlareEventType, payload?: unknown): void {
    const handlers = this.eventHandlers.get(type);
    if (!handlers) return;

    const event: IdPFlareEvent = {
      type,
      payload,
      timestamp: Date.now(),
    };

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    });
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Create an authorization header value for API requests
   */
  async getAuthorizationHeader(): Promise<string | null> {
    const token = await this.getAccessTokenSilent();
    return token ? `Bearer ${token}` : null;
  }

  /**
   * Make an authenticated fetch request
   * Automatically adds the Authorization header
   */
  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const authHeader = await this.getAuthorizationHeader();
    if (!authHeader) {
      throw new Error("Not authenticated");
    }

    const headers = new Headers(init?.headers);
    headers.set("Authorization", authHeader);

    return fetch(input, {
      ...init,
      headers,
    });
  }
}

/**
 * Create a new IDPFlare client instance
 */
export function createIdPFlareClient(config: IdPFlareConfig): IdPFlareClient {
  return new IdPFlareClient(config);
}

