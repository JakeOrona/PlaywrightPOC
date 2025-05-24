// helpers/loggingHelpers.ts

/**
 * Utility functions for consistent and organized logging throughout the test suite
 */

/**
 * Creates a section header with decorative borders
 */
export function logSectionHeader(title: string, emoji: string = '🎯'): void {
    const width = 80;
    const titleText = `${emoji} ${title}`;
    const padding = Math.max(0, width - titleText.length - 4);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    
    console.log('\n' + '═'.repeat(width));
    console.log(`║${' '.repeat(leftPad)}${titleText}${' '.repeat(rightPad)}║`);
    console.log('═'.repeat(width));
}

/**
 * Creates a subsection header with lighter borders
 */
export function logSubsectionHeader(title: string, emoji: string = '📌'): void {
    const width = 70;
    const titleText = `${emoji} ${title}`;
    const padding = Math.max(0, width - titleText.length - 4);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    
    console.log('\n' + '─'.repeat(width));
    console.log(`│${' '.repeat(leftPad)}${titleText}${' '.repeat(rightPad)}│`);
    console.log('─'.repeat(width));
}

/**
 * Creates a simple divider line
 */
export function logDivider(char: string = '─', width: number = 50): void {
    console.log(char.repeat(width));
}

/**
 * Logs a step with consistent indentation
 */
export function logStep(message: string, emoji: string = '▶️'): void {
    console.log(`  ${emoji} ${message}`);
}

/**
 * Logs a success message with consistent formatting
 */
export function logSuccess(message: string, emoji: string = '✅'): void {
    console.log(`  ${emoji} ${message}`);
}

/**
 * Logs a warning message with consistent formatting
 */
export function logWarning(message: string, emoji: string = '⚠️'): void {
    console.log(`  ${emoji} ${message}`);
}

/**
 * Logs an error message with consistent formatting
 */
export function logError(message: string, emoji: string = '❌'): void {
    console.log(`  ${emoji} ${message}`);
}

/**
 * Logs an info message with consistent formatting
 */
export function logInfo(message: string, emoji: string = 'ℹ️'): void {
    console.log(`  ${emoji} ${message}`);
}

/**
 * Creates a completion banner
 */
export function logCompletionBanner(message: string, emoji: string = '🎉'): void {
    const width = 80;
    const titleText = `${emoji} ${message} ${emoji}`;
    const padding = Math.max(0, width - titleText.length - 4);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    
    console.log('\n' + '🎊'.repeat(width / 2));
    console.log(`🎊${' '.repeat(leftPad)}${titleText}${' '.repeat(rightPad)}🎊`);
    console.log('🎊'.repeat(width / 2) + '\n');
}