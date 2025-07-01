# E2E Playwright Tests

This repository contains **end-to-end (E2E) tests** for the Ambire application, implemented using [Playwright](https://playwright.dev/) and [TypeScript](https://www.typescriptlang.org/).

## 📁 Structure

```
e2e-playwright/
├── common/           # Locators and other utilities
├── common-helpers/   # Local Storage
├── config/           # Environment configuration
├── constatns/        # Data
├── fixtures/         # Test fixture data (e.g., JSON files)
├── pages/            # Page Object Model (POM) files
├── tests/            # Test cases
├── node_modules/     # Dependencies
├── package.json      # Dependencies and scripts
├── package-lock.json
└── README.md         # This file
```

## 🛠️ Installation


# Navigate to the folder
```bash
cd e2e-playwright
```
# Install dependencies
```bash
npm install
```
# Install Playwright browser binaries
```bash
npx playwright install
```
# Install VSC extensions
- Playwright Test for VS Code
- Playwright Test Runner

## ▶️ Running Tests

```bash
# Run all tests
npx playwright test

# Run in headed mode (visible browser)
npx playwright test --headed

# Run a specific test file
npx playwright test tests/example.spec.ts
```

## 📊 Test Report

After running tests, an HTML report is generated:

```bash
npx playwright show-report
```

## 🧪 Debug Mode

To debug:

```bash
npx playwright test --debug
```

## ✅ Recommendations

- The structure uses the Page Object Model (POM) for better modularity and maintainability.
- Run tests locally before committing.
- Reports can be integrated into CI/CD environments for visibility.

## TODO: Improve README.md
