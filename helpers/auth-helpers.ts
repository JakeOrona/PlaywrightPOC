// helpers/authHelpers.ts
import { promises as fs } from 'fs';
import path from 'path';
import { Page } from '@playwright/test';

export interface AuthState {
    timestamp: number;
    data: any;
}

const AUTH_FILE_PATH = 'playwright/.auth/user.json';
const AUTH_FLAG_PATH = 'playwright/.auth/first-vote-completed.flag';
const AUTH_VALIDITY_HOURS = 168;

/**
 * Checks if the stored authentication state exists and is less than 168 hours old (7 days).
 * @returns Promise<boolean> - true if auth is valid and recent, false otherwise
 */
export async function isAuthStateValid(): Promise<boolean> {
    try {
        // Check if auth file exists
        const authExists = await fs.access(AUTH_FILE_PATH).then(() => true).catch(() => false);
        if (!authExists) {
            console.log('🔍 -No existing authentication state found.');
            return false;
        }

        // Read the auth file stats to get modification time
        const stats = await fs.stat(AUTH_FILE_PATH);
        const fileAge = Date.now() - stats.mtime.getTime();
        const maxAge = AUTH_VALIDITY_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

        const isValid = fileAge < maxAge;
        const ageInHours = Math.round(fileAge / (60 * 60 * 1000) * 10) / 10;

        if (isValid) {
            console.log(`✅ -Authentication state is valid (${ageInHours} hours old, limit: ${AUTH_VALIDITY_HOURS} hours)`);
        } else {
            console.log(`⏰ -Authentication state is expired (${ageInHours} hours old, limit: ${AUTH_VALIDITY_HOURS} hours)`);
        }

        return isValid;
    } catch (error) {
        console.error('❌ -Error checking authentication state:', error);
        return false;
    }
}

/**
 * Ensures the auth directory exists
 */
export async function ensureAuthDirectoryExists(): Promise<void> {
    const authDir = path.dirname(AUTH_FILE_PATH);
    try {
        await fs.access(authDir);
    } catch {
        await fs.mkdir(authDir, { recursive: true });
        console.log(`📁 -Created auth directory: ${authDir}`);
    }
}

/**
 * Removes the existing auth state file and related flags
 */
export async function clearAuthState(): Promise<void> {
    try {
        await fs.unlink(AUTH_FILE_PATH);
        console.log('🗑️ -Cleared existing authentication state');
    } catch (error) {
        // File might not exist, which is fine
        console.log('🔍 -No existing auth state to clear');
    }
}

/**
 * Gets the authentication file path
 */
export function getAuthFilePath(): string {
    return AUTH_FILE_PATH;
}

/**
 * Refreshes the stored authentication state by saving the current browser context
 * This captures any updated tokens/cookies from successful interactions
 * @param page - The current page with active session
 */
export async function refreshAuthState(page: Page): Promise<void> {
    try {
        const authFile = getAuthFilePath();
        await page.context().storageState({ path: authFile });
        console.log('🔄 -Authentication state refreshed successfully');
        
        // Update the file timestamp to reset the age counter
        const now = new Date();
        await fs.utimes(authFile, now, now);
        console.log('✅ -Auth state timestamp updated');
    } catch (error) {
        console.error('❌ -Error refreshing auth state:', error);
    }
}

/**
 * Checks if auth state should be proactively refreshed
 * Returns true if auth is still valid but getting older (>4 days)
 */
export async function shouldRefreshAuthState(): Promise<boolean> {
    try {
        const authExists = await fs.access(AUTH_FILE_PATH).then(() => true).catch(() => false);
        if (!authExists) return false;

        const stats = await fs.stat(AUTH_FILE_PATH);
        const fileAge = Date.now() - stats.mtime.getTime();
        const ageInHours = fileAge / (60 * 60 * 1000);
        
        // Refresh if auth is older than 96 hours (4 days) but still valid (<168 hours)
        return ageInHours > 96 && ageInHours < AUTH_VALIDITY_HOURS;
    } catch {
        return false;
    }
}

/**
 * Gets the age of the auth state in hours
 */
export async function getAuthStateAge(): Promise<number> {
    try {
        const stats = await fs.stat(AUTH_FILE_PATH);
        const fileAge = Date.now() - stats.mtime.getTime();
        return fileAge / (60 * 60 * 1000);
    } catch {
        return Infinity; // If file doesn't exist, return infinite age
    }
}