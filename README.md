# PlaywrightPOC

## 🚀 Project Overview
PlaywrightPOC is a **streamlined test automation framework** built with [Playwright](https://playwright.dev/) for **automated voting** on gaming servers. This project implements a **clean Page Object Model (POM)**, **intelligent Steam authentication**, and provides **detailed test reporting** with **Allure integration**.

## 📌 Features
- **Streamlined Voting Flow** - Simple 6-step process for reliable voting
- **Smart Steam Authentication** - Automatic detection of auth state and handling
- **Self-Healing Auth** - Auto-refreshes authentication tokens after every vote
- **Page Object Model (POM)** - Clean separation of concerns between voting and Steam auth
- **Parallel Test Execution** - All tests can run simultaneously without conflicts
- **Allure Reporting** - Detailed test analytics & visualization
- **Intelligent Error Handling** - Robust fallbacks and clear debugging info
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
Create and edit `properties.env` with your Steam credentials:
```ini
# Steam Account Credentials
USER_NAME=your_steam_username
PASSWORD=your_steam_password

# Steam Profile Settings  
STEAM_USER_ID=your_steam_display_name
```

#### 📝 Variable Explanations:
- **USER_NAME**: Your Steam login username (what you type to log in)
- **PASSWORD**: Your Steam account password
- **STEAM_USER_ID**: Your Steam display name (shown in Steam confirmation dialogs)

#### ❓ How to find your Steam display name:
1. Log in to Steam in a web browser
2. Look for the name that appears in login confirmation dialogs
3. This is your Steam profile/display name (**case-sensitive!**)

#### Example configuration:
```ini
USER_NAME=mysteamlogin
PASSWORD=mypassword123
STEAM_USER_ID=MyGamertag
```

### **4️⃣ Create and Configure `links.txt`**
Create a `links.txt` file inside the `/test-data/` directory:
```sh
mkdir -p test-data
touch test-data/links.txt
```

#### 📝 File Format
Add your voting links in this format:
```txt
link1:https://rust-servers.net/server/151475/
link2:https://rust-servers.net/server/151790/
link3:https://rust-servers.net/server/151562/
```

**Important Notes:**
- Each line should follow the format: `linkX:https://...`
- URLs must start with `https://` or `http://`
- No empty lines between entries
- Links are processed in order (link1 = first test, link2 = second test, etc.)

## 🚀 Running Tests

### **Streamlined Test Execution (Recommended)**
The smart runner automatically handles everything:
```sh
# Run all tests with automatic auth handling
npm run test:smart

# Force fresh authentication (clear auth first)
npm run test:force-auth

# Run individual tests for debugging
npm run test:individual first
npm run test:individual second  
npm run test:individual third

# Show help
npm run test:help
```

### **Individual Test Execution**
```sh
# Run all tests in parallel
npm run test:all

# Run specific test
npm run test:first
npm run test:second
npm run test:third

# Standard Playwright commands
npm run test
npx playwright test --headed  # For debugging
```

## 🧠 Streamlined Authentication System

### **How It Works**
Instead of trying to predict authentication state, the system lets **Steam itself** determine what's needed:

1. **Navigate to voting page**
2. **Click vote button and accept terms**  
3. **Click Steam sign-in button**
4. **Detect Steam page state**:
   - IF Steam login form visible → Perform full authentication
   - ELSE Steam user confirmation visible → Quick authorization
5. **Always capture fresh auth tokens**
6. **Process vote results**

### **Key Benefits**
✅ **Self-Healing** - If auth expires mid-session, automatically handles it  
✅ **Always Fresh** - Auth tokens refreshed after every successful vote  
✅ **Reliable** - Steam page state determines flow, not file age predictions  
✅ **Simple** - No complex conditional logic or auth setup coordination  
✅ **Parallel-Safe** - Tests don't interfere with each other's auth state  

### **Authentication Flow**
```
Navigate to Vote Page
         ↓
   Click Vote Button
         ↓
Accept Terms & Click Steam
         ↓
    Check Steam Page
    ┌─────┴─────┐
    ↓           ↓
Login Form    User ID
Visible?      Visible?
    ↓           ↓
Full Auth   Quick Auth
    └─────┬─────┘
          ↓
   Capture Fresh Auth
          ↓
   Process Vote Results
```

## 📊 Generating Test Reports

### **Allure Report (HTML-based UI)**
```sh
# Run tests with Allure reporting
npm run test:allure

# Generate report
npm run allure:report

# Open report in browser
npm run allure:open
```

## 📁 Project Structure
```sh
PlaywrightPOC/
├── tests/                      # Test specifications
│   ├── first-vote.spec.ts      # First server voting test
│   ├── second-vote.spec.ts     # Second server voting test  
│   └── third-vote.spec.ts      # Third server voting test
├── page-objects/               # Page Object Model files
│   ├── voting-page.ts          # Voting page actions and results
│   ├── steam-signin.ts         # Steam authentication handling
│   └── voting-handler.ts       # Main coordinator class
├── helpers/                    # Utility & helper functions
│   ├── auth-helpers.ts         # Authentication management
│   ├── methods.ts              # General helper methods
│   ├── results-collector.ts    # Vote results collection
│   └── logging-helpers.ts      # Consistent logging utilities
├── scripts/                    # Automation scripts  
│   └── smartRunner.js          # Streamlined test execution runner
├── test-data/                  # External test data (ignored in Git)
│   └── links.txt               # Voting server URLs
├── playwright/.auth/           # Authentication storage (ignored in Git)
│   └── user.json               # Stored authentication state
├── playwright.config.ts        # Playwright configuration
├── package.json                # Dependencies & scripts
├── properties.env              # Environment variables (ignored in Git)
└── README.md                   # Project documentation
```

## 🎯 Test Execution Scenarios

### **Scenario 1: Fresh System (No Auth)**
```
1. First test runs → Detects no auth → Performs full Steam login → Votes → Saves auth
2. Second test runs → Uses saved auth → Quick Steam authorization → Votes  
3. Third test runs → Uses saved auth → Quick Steam authorization → Votes
Result: All servers voted on, fresh auth state saved
```

### **Scenario 2: Valid Existing Auth**
```
1. First test runs → Detects valid auth → Quick Steam authorization → Votes → Refreshes auth
2. Second test runs → Uses refreshed auth → Quick Steam authorization → Votes
3. Third test runs → Uses refreshed auth → Quick Steam authorization → Votes  
Result: All servers voted on, auth tokens kept fresh
```

### **Scenario 3: Expired Auth (Mid-Session)**
```
1. First test runs → Auth expired → Automatically performs full login → Votes → Saves fresh auth
2. Second test runs → Uses fresh auth → Quick Steam authorization → Votes
3. Third test runs → Uses fresh auth → Quick Steam authorization → Votes
Result: Self-healing auth, all servers voted on
```

## 🔧 Configuration

### **Authentication Settings**
- **Storage Location**: `playwright/.auth/user.json`
- **Auto-Refresh**: After every successful vote or Steam interaction
- **Detection**: Real-time Steam page state analysis

### **Playwright Settings**
- **Execution**: Parallel (all tests can run simultaneously)
- **Timeouts**: 60 seconds for page loads and expectations
- **Screenshots**: Captured on failures and key voting stages
- **Browser**: Chrome (configurable for other browsers)

## 🛠️ Troubleshooting

### **Environment Setup Issues**
- **Missing `properties.env`**: Create the file using the template above
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
  1. Ensure `test-data/links.txt` exists
  2. Check that URLs start with `http://` or `https://`
  3. Verify format matches: `linkX:https://...`
- **"Need at least X voting links"**: Add more URLs to your `links.txt` file
- **Invalid URL format**: Each line should follow the `linkX:URL` pattern

### **Test Execution Issues**
- **Tests hang on Steam login**: Check your `USER_NAME` and `PASSWORD` in `properties.env`
- **Auth expires frequently**: This is normal - the system handles it automatically
- **Screenshot/results permissions**: Ensure `test-results/` directory is writable

### **Quick Reset Commands**
```sh
# Force fresh authentication
npm run test:force-auth

# Clear results and run fresh tests  
rm -rf test-results/ && npm run test:smart

# Clear everything and start over
rm -rf test-results/ playwright/.auth/ && npm run test:smart
```

## 🛡️ Error Handling & Reliability

- **Self-Healing Authentication**: Automatically detects and handles expired auth
- **Steam Mobile App Integration**: Automated handling of Steam's mobile confirmation
- **Real-Time State Detection**: Uses actual Steam page state, not predictions
- **Vote Status Processing**: Intelligent parsing of vote confirmations and cooldown messages
- **Robust Selectors**: Multiple fallback strategies for different page structures  
- **Comprehensive Logging**: Detailed console output for debugging and monitoring
- **Parallel-Safe Execution**: Tests don't interfere with each other's auth state

## 🚀 What Makes This System Special

### **Before (Complex)**
❌ 50+ lines of auth prediction logic per test  
❌ Separate auth setup projects with dependencies  
❌ File timestamp predictions (unreliable)  
❌ Complex conditional flows that could fail  
❌ Manual Steam button clicking and user ID verification  

### **After (Streamlined)**  
✅ **1 line per vote**: `await votingHandler.performStreamlinedVote(url)`  
✅ **Steam page determines flow** (reliable)  
✅ **Self-healing** if auth expires mid-session  
✅ **Always fresh tokens** after every vote  
✅ **True parallel execution** without conflicts  

## ⚖️ License
This project is **MIT licensed** – feel free to use and modify it as needed.

---
**Maintained by [Jake Orona](https://github.com/JakeOrona)** | Powered by **Playwright** 🚀