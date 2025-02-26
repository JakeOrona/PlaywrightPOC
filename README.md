# PlaywrightPOC

## 🚀 Project Overview
PlaywrightPOC is a **test automation framework** built with [Playwright](https://playwright.dev/) for **end-to-end testing** of web applications. This project implements a **Page Object Model (POM)** and integrates **Allure reporting** to provide detailed test insights.

## 📌 Features
- **Playwright Test Automation** (using TypeScript)
- **Page Object Model (POM)** for maintainable tests
- **Allure Reporting** for test analytics & visualization
- **Automatic retries & parallel execution**
- **Configurable environment variables via `.env`**
- **Configurable testData variable via `/testData/links.txt`**
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

### **Run All Tests**
```sh
npm run test
```

### **Run Tests with Allure Reporting**
```sh
npm run test:allure
```

### **Run a Specific Test File**
```sh
npx playwright test tests/vote.spec.ts
```

### **Run in Headed Mode (for Debugging)**
```sh
npx playwright test --headed
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
│-- tests/                   # Test specs
│-- pageObjects/             # Page Object Model files
│-- helpers/                 # Utility & helper functions
│-- testData/                # External test data (ignored in Git)
│-- reports/                 # Allure & Playwright reports
│-- playwright.config.ts     # Playwright global config
│-- package.json             # Project dependencies & scripts
│-- properties.env           # Environment variables (ignored in Git)
│-- README.md                # Project documentation
```

## ⚖️ License
This project is **MIT licensed** – feel free to use and modify it as needed.

---
**Maintained by [Jake Orona](https://github.com/JakeOrona)** | Powered by **Playwright** 🚀
