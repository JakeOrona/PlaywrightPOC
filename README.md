# PlaywrightPOC

## 🚀 Project Overview
PlaywrightPOC is a **smart test automation framework** built with [Playwright](https://playwright.dev/) for **end-to-end testing** of web applications. This project implements a **Page Object Model (POM)**, **smart authentication with storage state**, and integrates **Allure reporting** to provide detailed test insights.

## 📌 Features
- **Playwright Test Automation** (using TypeScript)
- **Page Object Model (POM)** for maintainable tests
- **Smart Authentication System** with 27-hour validity checking
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
Rename the `.env.example` file to `.env` and set your credentials.
```sh
cp properties.env.example properties.env
```
Edit `properties.env` with your required values:
```ini
USER_NAME=your_steam_username
PASSWORD=your_steam_password
```

### **4️⃣ Create and Configure `links.txt`**
Create a `links.txt` file inside the `/testData/` directory:
```sh
mkdir -p testData
touch testData/links.txt
```
Edit `testData/links.txt` and add voting links, each on a new line:
```txt
https://rust-servers.net/server/abc123/
https://rust-servers.net/server/xyz123/
https://rust-servers.net/server/123abc/
```

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
1. **Authentication Validity Check**: Automatically checks if stored authentication is less than 27 hours old
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
    │ < 27hrs │────▶│ Skip Setup   │
    └─────────┘     └──────────────┘
         │
    ┌────▼────┐     ┌──────────────┐
    │ > 27hrs │────▶│ Run Setup    │
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
│   └── links.txt               # Voting server URLs
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

### **Scenario 2: Valid Existing Authentication (< 27 hours)**
```
1. Setup runs → Sees valid auth → SKIPS setup
2. First vote test → No flag found → Uses stored auth → Votes on server 1
3. Second vote test → Uses stored auth → Votes on server 2
4. Third vote test → Uses stored auth → Votes on server 3
Result: Each server voted on exactly once
```

### **Scenario 3: Expired Authentication (> 27 hours)**
```
1. Setup runs → Auth expired → Fresh Steam login → Votes on server 1 → Sets flag
2. First vote test → Sees flag → SKIPS (no double vote!)
3. Second vote test → Uses fresh auth → Votes on server 2
4. Third vote test → Uses fresh auth → Votes on server 3
Result: Each server voted on exactly once
```

## 🔧 Configuration

### **Authentication Settings**
- **Validity Period**: 27 hours (configurable in `helpers/authHelpers.ts`)
- **Storage Location**: `playwright/.auth/user.json`
- **Flag Tracking**: `playwright/.auth/first-vote-completed.flag`

### **Playwright Settings**
- **Execution**: Sequential (non-parallel) for reliable authentication flow
- **Timeouts**: 60 seconds for page loads and expectations
- **Screenshots**: Captured on failures and at key voting stages
- **Browser**: Chrome (configurable for other browsers)

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