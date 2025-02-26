import { promises as fs } from 'fs';
import { Page, expect } from '@playwright/test';

export interface LinkData {
  [key: string]: string;
}

/**
 * Reads a text file formatted as key-value pairs (e.g., "link1:https://example.com")
 * and returns an array of links.
 * @param filePath - Path to the text file.
 * @returns A promise that resolves to an array of extracted links.
 */
export async function loadVotingLinks(filePath: string): Promise<string[]> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const lines = fileContent.split('\n');
      const links: string[] = [];
  
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Skip empty lines
  
        // Updated regex to capture links directly after ':'
        const match = trimmedLine.match(/https?:\/\/[^\s]+/);
        if (match) {
          links.push(match[0]); // Add the extracted URL to the array
        }
      }
  
      return links;
    } catch (error) {
      console.error(`Error loading voting links from ${filePath}:`, error);
      throw error;
    }
}

/**
 * Centers text within a fixed-width box.
 * @param text - The text to be centered.
 * @param width - The total width of the output.
 * @returns A centered string with equal padding.
 */
export const centerText = (text: string, width: number): string => {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return " ".repeat(leftPad) + text + " ".repeat(rightPad);
};

/**
 * Ensures text fits within a fixed width by padding or truncating.
 * @param text - The text to format.
 * @param width - The total width of the content inside the box (excluding borders).
 * @returns A formatted string with consistent length.
 */
export const formatText = (text: string, width: number): string => {
  if (text.length > width) {
      return text.substring(0, width - 3) + "..."; // Truncate if too long
  }
  return text.padEnd(width, " "); // Pad with spaces if too short
};

/**
 * Handles vote status and formats output for consistent display.
 * @param headingText - The page heading (e.g., server name).
 * @param voteConfirmed - Whether the vote was confirmed.
 * @param dailyLimitText - The "You have reached your daily vote limit" text.
 * @param nextVoteText - The cooldown message (e.g., next vote available time).
 * @returns The formatted vote result as a string
 */
export function handleVoteFormatting(
  headingText: string,
  voteConfirmed: boolean,
  dailyLimitText?: string,
  nextVoteText?: string
): string {
  const MAX_WIDTH = 70; // Box width including borders
  const CONTENT_WIDTH = MAX_WIDTH - 4; // Inner text width (excluding "│ ")
  const resultLines: string[] = []; // Array to store all results

  // Function to format multi-line text correctly
  const formatMultiLineText = (text: string): string[] => {
    return text.split("\n").map(line => formatText("🕒 " + line.trim(), CONTENT_WIDTH));
  };

  // Top border
  resultLines.push(`┌${"─".repeat(MAX_WIDTH - 2)}┐`);
  resultLines.push(`| ${formatText(`Checking ${headingText}`, CONTENT_WIDTH)} |`);

  if (voteConfirmed) {
    // ✅ Case 1: Vote Confirmed (No warnings)
    resultLines.push(`│ ${formatText("✅ Vote Confirmed!", CONTENT_WIDTH)} │`);
  } else if (dailyLimitText && nextVoteText) {
    // ⚠️ Case 2: Daily Vote Limit Reached
    resultLines.push(`│ ${formatText("⚠️ " + dailyLimitText, CONTENT_WIDTH)} │`);
    
    // Process nextVoteText with 🕒 added per line
    const formattedLines = formatMultiLineText(nextVoteText);
    formattedLines.forEach(line => resultLines.push(`│ ${line} │`));
  } else {
    // 🚫 Case 3: No Vote Status
    resultLines.push(`│ ${formatText("🚫 No visible vote status detected.", CONTENT_WIDTH)} │`);
  }

  // Bottom border
  resultLines.push(`└${"─".repeat(MAX_WIDTH - 2)}┘\n`);

  // ✅ Store in the results array
  return resultLines.join("\n");
}