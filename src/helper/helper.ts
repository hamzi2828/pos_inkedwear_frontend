// src/helper/helper.ts

// JWT payload base fields
export interface JwtBasePayload {
    iat?: number;
    exp?: number;
  }
  
  // Payload we issued from the backend
  export interface UserPayload extends JwtBasePayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }
  
  const TOKEN_KEY = 'auth_token';
  const ROLE_KEY = 'auth_role';
  const EMPLOYEE_ID_KEY = 'auth_employee_id';
  
  function base64UrlDecode(input: string): string {
    // base64url -> base64
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
    // pad with =
    const pad = b64.length % 4 ? 4 - (b64.length % 4) : 0;
    const b64Padded = b64 + '='.repeat(pad);
    if (typeof window === 'undefined') {
      // SSR-safe
      return Buffer.from(b64Padded, 'base64').toString('utf8');
    }
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(b64Padded), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
  
  export function decodeJwt<T = unknown>(token: string): T | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payloadJson = base64UrlDecode(parts[1]);
      return JSON.parse(payloadJson) as T;
    } catch {
      return null;
    }
  }
  
  export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }
  
  export function getUserFromToken(token: string): UserPayload | null {
    const payload = decodeJwt<UserPayload>(token);
    if (!payload) return null;
    // Check expiration if present
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    // Minimal shape validation
    if (!payload.id || !payload.email) return null;
    return payload;
  }
  
  export function getCurrentUser(): UserPayload | null {
    const token = getAuthToken();
    if (!token) return null;
    return getUserFromToken(token);
  }
  
  export function isAuthenticated(): boolean {
    return !!getCurrentUser();
  }
  
  export function getAuthHeader(): Record<string, string> {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Set token in localStorage and cookie so middleware can read it
  export function setToken(token: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    try {
      document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; samesite=lax`;
    } catch {}
  }

  // Remove token from both localStorage and cookie
  export function removeToken() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem(EMPLOYEE_ID_KEY);
    try {
      document.cookie = `${TOKEN_KEY}=; Max-Age=0; path=/; samesite=lax`;
      document.cookie = `${ROLE_KEY}=; Max-Age=0; path=/; samesite=lax`;
      document.cookie = `auth_permissions=; Max-Age=0; path=/; samesite=lax`;
    } catch {}
  }

  // Fetch with Authorization header when token is present
  export async function authorizedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
    const token = getAuthToken();
    const headers = new Headers(init.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }

  // Role helpers for admin gating in frontend and middleware
  export type UserRole = 'user' | 'admin' | 'moderator' | string;

  const PERMISSIONS_KEY = 'auth_permissions';

  export function getRole(): UserRole | null {
    if (typeof window === 'undefined') return null;
    const role = localStorage.getItem(ROLE_KEY) as UserRole | null;
    return role ?? null;
  }

  export function setRole(role: UserRole) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ROLE_KEY, role);
    try {
      document.cookie = `${ROLE_KEY}=${encodeURIComponent(role)}; path=/; samesite=lax`;
    } catch {}
  }

  export function removeRole() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ROLE_KEY);
    try {
      document.cookie = `${ROLE_KEY}=; Max-Age=0; path=/; samesite=lax`;
    } catch {}
  }

  // Permissions helpers
  export function getPermissions(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const permissions = localStorage.getItem(PERMISSIONS_KEY);
      return permissions ? JSON.parse(permissions) : [];
    } catch {
      return [];
    }
  }

  export function setPermissions(permissions: string[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
    try {
      document.cookie = `${PERMISSIONS_KEY}=${encodeURIComponent(JSON.stringify(permissions))}; path=/; samesite=lax`;
    } catch {}
  }

  export function removePermissions() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PERMISSIONS_KEY);
    try {
      document.cookie = `${PERMISSIONS_KEY}=; Max-Age=0; path=/; samesite=lax`;
    } catch {}
  }

  export function hasPermission(permission: string): boolean {
    const permissions = getPermissions();
    // If no permissions set, allow all (fallback for admin or initial setup)
    if (permissions.length === 0) return true;
    return permissions.includes(permission);
  }

  // Currency helpers
  export function getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      INR: '₹',
      CNY: '¥',
      PKR: 'Rs ',
    };
    return symbols[currencyCode] || 'Rs ';
  }

  export function formatCurrency(amount: number, currencyCode: string = 'PKR'): string {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toFixed(2)}`;
  }

  // Employee ID helpers for activity logging
  export function getEmployeeId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(EMPLOYEE_ID_KEY);
  }

  export function setEmployeeId(employeeId: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(EMPLOYEE_ID_KEY, employeeId);
  }

  export function removeEmployeeId() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(EMPLOYEE_ID_KEY);
  }