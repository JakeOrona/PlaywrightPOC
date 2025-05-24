// helpers/resultsCollector.ts
import { promises as fs } from 'fs';
import path from 'path';

const RESULTS_FILE_PATH = 'test-results/vote-results.json';

export interface VoteResult {
    serverName: string;
    serverUrl: string;
    result: string;
    timestamp: string;
}

/**
 * Adds a vote result to the collection
 */
export async function addVoteResult(serverUrl: string, serverName: string, formattedResult: string): Promise<void> {
    try {
        const result: VoteResult = {
            serverName,
            serverUrl,
            result: formattedResult,
            timestamp: new Date().toISOString()
        };

        // Ensure results directory exists
        const resultsDir = path.dirname(RESULTS_FILE_PATH);
        try {
            await fs.access(resultsDir);
        } catch {
            await fs.mkdir(resultsDir, { recursive: true });
        }

        // Read existing results or create empty array
        let existingResults: VoteResult[] = [];
        try {
            const fileContent = await fs.readFile(RESULTS_FILE_PATH, 'utf-8');
            existingResults = JSON.parse(fileContent);
        } catch {
            // File doesn't exist or is invalid, start fresh
        }

        // Add new result
        existingResults.push(result);

        // Write back to file
        await fs.writeFile(RESULTS_FILE_PATH, JSON.stringify(existingResults, null, 2));
        
    } catch (error) {
        console.error('❌ -Error saving vote result:', error);
    }
}

/**
 * Retrieves all vote results from the current session
 */
export async function getAllVoteResults(): Promise<VoteResult[]> {
    try {
        const fileContent = await fs.readFile(RESULTS_FILE_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch {
        return [];
    }
}

/**
 * Clears all vote results (call at start of new test run)
 */
export async function clearVoteResults(): Promise<void> {
    try {
        await fs.unlink(RESULTS_FILE_PATH);
        console.log('🗑️ -Cleared previous vote results');
    } catch {
        // File doesn't exist, which is fine
    }
}

/**
 * Prints a formatted summary of all vote results
 */
export async function printVoteResultsSummary(): Promise<void> {
    const results = await getAllVoteResults();
    
    if (results.length === 0) {
        console.log('\n📜 No vote results to display.\n');
        return;
    }

    console.log('\n📜 Summary of Vote Results:\n');
    results.forEach((result) => {
        console.log(result.result);
    });
}