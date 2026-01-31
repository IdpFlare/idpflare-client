/**
 * @idpflare/client
 * OAuth 2.0 / OpenID Connect client library for IDPFlare
 *
 * @example
 * ```typescript
 * import { createIdPFlareClient } from '@idpflare/client';
 *
 * const client = createIdPFlareClient({
 *   authority: 'https://auth.example.com',
 *   clientId: 'my-app',
 *   redirectUri: 'https://myapp.com/callback',
 * });
 *
 * // Login
 * await client.login();
 *
 * // Check auth status
 * if (client.isAuthenticated()) {
 *   const user = await client.getUserInfo();
 * }
 * ```
 */

// Re-export everything from core
export * from "./core/index";

