// scripts/daily-scheduler.js
const cron = require('node-cron');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

/**
 * Daily Playwright Voting Automation Scheduler
 * Integrates with your existing smart-runner.js for reliable daily voting
 */
class DailyVotingScheduler {
    constructor() {
        this.logFile = 'logs/daily-automation.log';
        this.isRunning = false;
        this.ensureLogDirectory();
    }

    async ensureLogDirectory() {
        try {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
    }

    async log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        // Log to console with color
        console.log(logMessage);
        
        // Log to file
        try {
            await fs.appendFile(this.logFile, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    async runVotingAutomation() {
        if (this.isRunning) {
            await this.log('⚠️  Voting automation already running, skipping this execution');
            return;
        }

        this.isRunning = true;
        
        try {
            await this.log('🚀 Starting daily voting automation...');
            
            // Use your existing smart runner with force-auth for reliability
            execSync('node scripts/smart-runner.js force-auth', { 
                stdio: 'inherit',
                cwd: process.cwd(),
                timeout: 300000 // 5 minute timeout
            });
            
            await this.log('✅ Daily voting automation completed successfully');
            
            // Optional: Log current results summary
            await this.logResultsSummary();
            
        } catch (error) {
            await this.log(`❌ Daily voting automation failed: ${error.message}`);
            await this.log(`💥 Error details: ${error.toString()}`);
            
            // Try a fallback run with regular smart runner
            try {
                await this.log('🔄 Attempting fallback run...');
                execSync('node scripts/smart-runner.js', { 
                    stdio: 'inherit',
                    cwd: process.cwd(),
                    timeout: 300000
                });
                await this.log('✅ Fallback run completed successfully');
            } catch (fallbackError) {
                await this.log(`❌ Fallback run also failed: ${fallbackError.message}`);
            }
        } finally {
            this.isRunning = false;
        }
    }

    async logResultsSummary() {
        try {
            const resultsFile = 'test-results/vote-results.json';
            const fileExists = await fs.access(resultsFile).then(() => true).catch(() => false);
            
            if (fileExists) {
                const results = JSON.parse(await fs.readFile(resultsFile, 'utf-8'));
                await this.log(`📊 Processed ${results.length} server votes in this run`);
                
                for (const result of results) {
                    const status = result.result.includes('Vote Confirmed') ? '✅' : 
                                    result.result.includes('daily vote limit') ? '⚠️' : '❓';
                    await this.log(`   ${status} ${result.serverName}`);
                }
            }
        } catch (error) {
            await this.log('📊 Could not read results summary');
        }
    }

    startScheduler(customSchedule = null) {
        // Default schedule: Daily at 9:00 PM
        const dailySchedule = customSchedule?.schedule || '0 0 21 * * *';
        const timezone = customSchedule?.timezone || 'America/Chicago';

        // Daily voting run at 9 PM
        cron.schedule(dailySchedule, async () => {
            await this.log('⏰ Daily scheduled voting run triggered (9:00 PM)');
            await this.runVotingAutomation();
        }, {
            scheduled: true,
            timezone: timezone
        });

        this.log(`📅 Daily voting scheduler started with timezone: ${timezone}`);
        this.log(`🌙 Daily runs: ${dailySchedule} (9:00 PM)`);
        this.log('🔄 Scheduler is running... Press Ctrl+C to stop');
        this.log(`📝 Logs are being saved to: ${this.logFile}`);
    }

    // Method to run voting immediately (for testing)
    async runTestNow() {
        await this.log('🧪 Running immediate voting test...');
        await this.runVotingAutomation();
    }

    // Method to show current status
    async showStatus() {
        await this.log('📋 Checking daily scheduler status...');
        
        // Check if log file exists and show recent entries
        try {
            const logExists = await fs.access(this.logFile).then(() => true).catch(() => false);
            if (logExists) {
                const logContent = await fs.readFile(this.logFile, 'utf-8');
                const lines = logContent.split('\n').filter(line => line.trim());
                const recentLines = lines.slice(-10); // Last 10 log entries
                
                console.log('\n📜 Recent log entries:');
                recentLines.forEach(line => console.log(line));
            } else {
                await this.log('📝 No previous logs found - scheduler hasn\'t run yet');
            }
        } catch (error) {
            await this.log('❌ Could not read log file');
        }

        // Check auth state
        try {
            const authExists = await fs.access('playwright/.auth/user.json').then(() => true).catch(() => false);
            await this.log(`🔐 Auth state: ${authExists ? 'Present' : 'Missing'}`);
        } catch (error) {
            await this.log('🔐 Auth state: Unknown');
        }
    }
}

// Command line interface with enhanced options
(function() {
    const scheduler = new DailyVotingScheduler();
    const command = process.argv[2];
    const option = process.argv[3];

    if (command === 'test-now') {
        scheduler.runTestNow();
        
    } else if (command === 'start') {
        // Parse custom schedule if provided
        let customSchedule = null;
        if (option === 'custom') {
            // Example custom usage: npm run schedule:start custom 
            customSchedule = {
                schedule: '0 30 20 * * *',  // 8:30 PM instead of 9:00 PM
                timezone: 'America/Chicago'
            };
        }
        
        scheduler.startScheduler(customSchedule);
        
        // Keep the process running
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping daily voting scheduler...');
            console.log('📋 Final status check:');
            scheduler.showStatus().then(() => {
                process.exit(0);
            });
        });
        
        // Prevent the script from exiting
        setInterval(() => {}, 1000);
        
    } else if (command === 'status') {
        scheduler.showStatus();
        
    } else if (command === 'help') {
        console.log('\n📖 Daily Voting Scheduler Usage:');
        console.log('   npm run schedule:start        - Start daily automation (9:00 PM)');
        console.log('   npm run schedule:test         - Run voting tests immediately');
        console.log('   npm run schedule:help         - Show this help');
        console.log('');
        console.log('🔧 Advanced usage:');
        console.log('   node scripts/dailyScheduler.js start custom  - Use custom schedule');
        console.log('   node scripts/dailyScheduler.js status        - Check scheduler status');
        console.log('');
        console.log('⏰ Default Schedule:');
        console.log('   🌙 Daily: 9:00 PM Central Time');
        console.log('');
        console.log('📝 Logs saved to: logs/daily-automation.log');
        console.log('🔐 Uses your existing Steam auth from properties.env');
        console.log('');
        console.log('🎯 This integrates with your existing smartRunner.js');
        console.log('   - Uses force-auth for maximum reliability');
        console.log('   - Includes fallback to regular smart runner');
        console.log('   - Logs detailed results and status information');
        
    } else {
        console.log('\n⚠️  Invalid command. Use "npm run schedule:help" for usage information.');
    }
})();