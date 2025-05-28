# PlaywrightPOC

## 🚀 Project Overview
PlaywrightPOC is a **smart test automation framework** built with [Playwright](https://playwright.dev/) for **end-to-end testing** of web applications. This project implements a **Page Object Model (POM)**, **smart authentication with storage state**, and integrates **Allure reporting** to provide detailed test insights.

## 📌 Features
- **Playwright Test Automation** (using TypeScript)
- **Page Object Model (POM)** for maintainable tests
- **Smart Authentication System** with 168-hour(7 days) validity checking
- **Storage State Management** to avoid redundant logins
- **Duplicate Vote Prevention** with intelligent flag tracking
- **Allure Reporting** for test analytics & visualization
- **Dynamic Authentication Fallbacks** for robust test execution
- **Headless & headed execution modes**

## 🛠️ Installation & Setup

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/JakeOrona/PlaywrightPOC.git
cd PlaywrightPOC
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Configure Environment Variables**
Edit properties.env with your Steam credentials:
```ini
# Steam Account Credentials
USER_NAME=your_steam_username
PASSWORD=your_steam_password

# Steam Profile Settings
STEAM_USER_ID=your_steam_display_name
```
#### 📝 Variable Explanations:
- USER_NAME: Your Steam login username (what you type to log in)
- PASSWORD: Your Steam account password
- STEAM_USER_ID: Your Steam display name (shown in login confirmation pages)

#### ❓ How to find your Steam display name:
- Log in to Steam in a web browser
- Look for the name that appears in login confirmation dialogs
- This is your Steam profile/display name (case-sensitive!)

#### Example configuration:
```ini
USER_NAME=mysteamlogin
PASSWORD=mypassword123
STEAM_USER_ID=MyGamertag
```

### **4️⃣ Create and Configure `links.txt`**
Create a `links.txt` file inside the `/testData/` directory:
```sh
mkdir -p testData
touch testData/links.txt
```
Edit `testData/links.txt` and add voting links, each on a new line.

#### 📝 Important: File Format
The links.txt file should contain one complete URL per line with no prefixes or additional formatting:
```txt
https://rust-servers.net/server/abc123/
https://rust-servers.net/server/xyz123/
https://rust-servers.net/server/123abc/
```

✅ Correct Format:

- Each line contains only the complete URL
- No "link1:", "server1:", or other prefixes
- URLs must start with https:// or http://
- One URL per line, no empty lines between URLs

❌ Incorrect Format:
```txt
link1:https://rust-servers.net/server/abc123/
server1 = https://rust-servers.net/server/xyz123/
https://rust-servers.net/server/123abc/ - Main Server
```

#### 🔍 How the framework reads the file:
The system uses regex pattern matching to extract URLs directly from each line, so any additional text or formatting will be ignored, but it's best to keep the format clean for reliability.

#### 📊 Server Processing Order:
- Line 1: First server (processed during authentication setup OR first-vote test)
- Line 2: Second server (processed by second-vote test)
- Line 3: Third server (processed by third-vote test)
- Additional lines: Can be added for future expansion

## 🚀 Running Tests

### **Smart Test Execution (Recommended)**
Automatically handles authentication and runs all voting tests:
```sh
npm run test:smart
```

### **Force Fresh Authentication**
Clears stored authentication and performs fresh login:
```sh
npm run test:force-auth
```

### **Individual Test Execution**
```sh
# Run authentication setup only
npm run test:setup

# Run voting tests only (requires valid auth)
npm run test:votes

# Run all tests (setup + votes)
npm run test:all
```

### **Standard Playwright Commands**
```sh
# Run all tests
npm run test

# Run a specific test file
npx playwright test tests/first-vote.spec.ts

# Run in headed mode (for debugging)
npx playwright test --headed
```

## 🧠 Smart Authentication System

### **How It Works**
1. **Authentication Validity Check**: Automatically checks if stored authentication is less than 168 hours(7 days) old
2. **Smart Setup**: Only performs Steam login when authentication is invalid or missing
3. **Vote Tracking**: Prevents duplicate voting on the first server using flag files
4. **Dynamic Fallbacks**: Each test can handle authentication independently if needed

### **Authentication Flow**
```
┌─ Smart Runner ─┐
│ Check Auth Age │
└────────┬───────┘
         │
    ┌────▼────┐     ┌──────────────┐
    │ < 7days │────▶│ Skip Setup   │
    └─────────┘     └──────────────┘
         │
    ┌────▼────┐     ┌──────────────┐
    │ > 7days │────▶│ Run Setup    │
    └─────────┘     └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Save Auth +  │
                    │ Flag First   │
                    │ Vote Done    │
                    └──────────────┘
```

## 📊 Generating Test Reports

### **Allure Report (HTML-based UI)**
After running tests with `npm run test:allure`, generate the report:
```sh
npm run allure:report
```
To open the Allure report:
```sh
npm run allure:open
```

## 📁 Project Structure
```sh
PlaywrightPOC/
├── tests/                      # Test specifications
│   ├── auth.setup.ts           # Authentication setup
│   ├── first-vote.spec.ts      # First server voting test
│   ├── second-vote.spec.ts     # Second server voting test
│   └── third-vote.spec.ts      # Third server voting test
├── pageObjects/                # Page Object Model files
│   └── paradiseIslandLinks.ts  # Main voting page object
├── helpers/                    # Utility & helper functions
│   ├── authHelpers.ts          # Authentication management
│   └── methods.ts              # General helper methods
├── scripts/                    # Automation scripts
│   └── smartRunner.js          # Smart test execution runner
├── testData/                   # External test data (ignored in Git)
│   └── links.txt               # Voting server URLs (one URL per line)
├── playwright/.auth/           # Authentication storage (ignored in Git)
│   ├── user.json               # Stored authentication state
│   └── first-vote-completed.flag # Vote tracking flag
├── playwright.config.ts        # Playwright configuration
├── package.json                # Dependencies & scripts
├── properties.env              # Environment variables (ignored in Git)
└── README.md                   # Project documentation
```

## 🎯 Test Execution Scenarios

### **Scenario 1: No Existing Authentication**
```
1. Setup runs → Fresh Steam login → Votes on server 1 → Sets completion flag
2. First vote test → Sees flag → SKIPS (no double vote!)
3. Second vote test → Uses stored auth → Votes on server 2
4. Third vote test → Uses stored auth → Votes on server 3
Result: Each server voted on exactly once
```

### **Scenario 2: Valid Existing Authentication (< 168 hours/7 days)**
```
1. Setup runs → Sees valid auth → SKIPS setup
2. First vote test → No flag found → Uses stored auth → Votes on server 1
3. Second vote test → Uses stored auth → Votes on server 2
4. Third vote test → Uses stored auth → Votes on server 3
Result: Each server voted on exactly once
```

### **Scenario 3: Expired Authentication (> 168 hours/7 days)**
```
1. Setup runs → Auth expired → Fresh Steam login → Votes on server 1 → Sets flag
2. First vote test → Sees flag → SKIPS (no double vote!)
3. Second vote test → Uses fresh auth → Votes on server 2
4. Third vote test → Uses fresh auth → Votes on server 3
Result: Each server voted on exactly once
```

## 🔧 Configuration

### **Authentication Settings**
- **Validity Period**: 168 hours (configurable in `helpers/authHelpers.ts`)
- **Storage Location**: `playwright/.auth/user.json`
- **Flag Tracking**: `playwright/.auth/first-vote-completed.flag`

### **Playwright Settings**
- **Execution**: Sequential (non-parallel) for reliable authentication flow
- **Timeouts**: 60 seconds for page loads and expectations
- **Screenshots**: Captured on failures and at key voting stages
- **Browser**: Chrome (configurable for other browsers)

## 🛠️ Troubleshooting

### **Environment Setup Issues**
- **Missing `properties.env.example`**: Create the file using the template above
- **"Cannot find module" errors**: Run `npm install` to install dependencies
- **Permission errors**: Ensure your user has write access to the project directory

### **Authentication Issues**
- **"STEAM_USER_ID environment variable is required"**: Add all three variables to `properties.env`
- **Steam Mobile App not responding**: Ensure the Steam Mobile app is installed and you're logged in
- **"Steam ID not found" errors**: 
  1. Verify your `STEAM_USER_ID` matches your actual Steam display name exactly (case-sensitive)
  2. Log in to Steam in a browser to see your display name
  3. Update `properties.env` with the correct display name

### **Links File Issues**
- **"No voting links loaded"**: 
  1. Ensure `testData/links.txt` exists
  2. Check that URLs start with `http://` or `https://`
  3. Verify no empty lines or invalid URLs
- **"Need at least X voting links"**: Add more URLs to your `links.txt` file
- **Invalid URL format**: Each line should contain only a complete URL

### **Test Execution Issues**
- **Tests hang on Steam login**: Check your `USER_NAME` and `PASSWORD` in `properties.env`
- **Parallel execution conflicts**: The framework handles this automatically with smart authentication
- **Screenshot/results permissions**: Ensure `test-results/` directory is writable
- **Authentication expires frequently**: This is normal - the system uses 168-hour(7 days) validity for security

### **Quick Reset Commands**
```sh
# Clear authentication and force fresh login
npm run test:force-auth

# Clear results and run fresh tests
rm -rf test-results/ && npm run test:smart

# Clear everything and start over
rm -rf test-results/ playwright/.auth/ && npm run test:smart
```

## 🛡️ Error Handling & Reliability

- **Dynamic Authentication**: Tests fall back to fresh authentication if stored state fails
- **Steam Mobile App Integration**: Automated handling of Steam's mobile confirmation
- **Vote Status Detection**: Intelligent parsing of vote confirmations and cooldown messages
- **Robust Selectors**: XPath and CSS selectors with fallback strategies
- **Comprehensive Logging**: Detailed console output for debugging and monitoring

## ⚖️ License
This project is **MIT licensed** – feel free to use and modify it as needed.

---
**Maintained by [Jake Orona](https://github.com/JakeOrona)** | Powered by **Playwright** 🚀