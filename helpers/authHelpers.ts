// helpers/authHelpers.ts
import { promises as fs } from 'fs';
import path from 'path';

export interface AuthState {
    timestamp: number;
    data: any;
}

const AUTH_FILE_PATH = 'playwright/.auth/user.json';
const AUTH_FLAG_PATH = 'playwright/.auth/first-vote-completed.flag';
const AUTH_VALIDITY_HOURS = 36;

/**
 * Checks if the stored authentication state exists and is less than 36 hours old
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
 * Checks if the first vote was completed during the current test run session
 * This flag is only valid for the current test execution, not across multiple runs
 * @returns Promise<boolean> - true if first vote was already completed in this run, false otherwise
 */
export async function isFirstVoteCompleted(): Promise<boolean> {
    try {
        const flagExists = await fs.access(AUTH_FLAG_PATH).then(() => true).catch(() => false);
        if (!flagExists) {
            console.log('🔍 -No first vote completion flag found.');
            return false;
        }

        // Read flag content to check if it's for the current test run
        const flagContent = await fs.readFile(AUTH_FLAG_PATH, 'utf-8');
        const flagData = JSON.parse(flagContent);
        
        // Check if the flag file is newer than or same age as the auth file
        const [flagStats, authStats] = await Promise.all([
            fs.stat(AUTH_FLAG_PATH),
            fs.stat(AUTH_FILE_PATH).catch(() => null)
        ]);

        if (!authStats) {
            console.log('⚠️ -Auth file missing but flag exists, clearing flag.');
            await clearFirstVoteFlag();
            return false;
        }

        const flagAge = flagStats.mtime.getTime();
        const authAge = authStats.mtime.getTime();
        
        // Flag is only valid if it's from the same auth session AND the same test run
        const isCompleted = flagAge >= authAge && flagData.runId === process.env.PLAYWRIGHT_RUN_ID;
        
        if (isCompleted) {
            console.log('✅ -First vote already completed in current test run session');
        } else {
            console.log('🔍 -First vote flag is from different run or auth session, needs new vote');
        }

        return isCompleted;
    } catch (error) {
        console.error('❌ -Error checking first vote completion:', error);
        return false;
    }
}

/**
 * Marks that the first vote has been completed in the current test run session
 */
export async function markFirstVoteCompleted(): Promise<void> {
    try {
        await ensureAuthDirectoryExists();
        
        // Create a unique run ID for this test execution if it doesn't exist
        if (!process.env.PLAYWRIGHT_RUN_ID) {
            process.env.PLAYWRIGHT_RUN_ID = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
        }
        
        const flagData = {
            timestamp: new Date().toISOString(),
            runId: process.env.PLAYWRIGHT_RUN_ID,
            completedDuringAuth: true
        };
        
        await fs.writeFile(AUTH_FLAG_PATH, JSON.stringify(flagData, null, 2));
        console.log('🏁 -Marked first vote as completed for current test run session');
    } catch (error) {
        console.error('❌ -Error marking first vote as completed:', error);
    }
}

/**
 * Clears the first vote completion flag to allow fresh voting in new test runs
 */
export async function clearFirstVoteFlag(): Promise<void> {
    try {
        await fs.unlink(AUTH_FLAG_PATH);
        console.log('🗑️ -Cleared first vote completion flag');
    } catch (error) {
        // File might not exist, which is fine
        console.log('🔍 -No first vote flag to clear');
    }
}

/**
 * Initializes a new test run by clearing the first vote flag
 * This ensures each test execution can vote on all servers
 */
export async function initializeTestRun(): Promise<void> {
    try {
        // Generate a unique run ID for this test execution
        process.env.PLAYWRIGHT_RUN_ID = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
        
        // Clear any existing first vote flag from previous runs
        await clearFirstVoteFlag();
        console.log(`🚀 -Initialized new test run with ID: ${process.env.PLAYWRIGHT_RUN_ID}`);
    } catch (error) {
        console.error('❌ -Error initializing test run:', error);
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
    
    // Also clear the first vote flag when clearing auth
    await clearFirstVoteFlag();
}

/**
 * Gets the authentication file path
 */
export function getAuthFilePath(): string {
    return AUTH_FILE_PATH;
}