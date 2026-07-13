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

## 🔐 Running the Ledger tests locally (Speculos emulator)

The Ledger tests (`@ledgerTests`) drive a [Speculos](https://github.com/LedgerHQ/speculos)
emulator that runs in Docker. It exposes the APDU port on `9999` and the HTTP API on `5000`.

### Prerequisites
- **Docker running.**
  - **macOS:** start Docker Desktop.
  - **Linux:** make sure the daemon is running and your user can reach it. If you get
    `permission denied ... /var/run/docker.sock`, add yourself to the `docker` group once:
    ```bash
    sudo usermod -aG docker "$USER" && newgrp docker   # or log out/in
    ```
- **A built extension.** The tests load `build/webkit-prod`. From the **repo root**:
  ```bash
  yarn build:web:webkit
  ```
- **A populated repo-root `.env`** containing `LEDGER_EMULATOR_SEED`, `LEDGER_EMULATOR_HTTP_URL`
  and the `LEDGER_*` account vars. The seed is a mnemonic (contains spaces), so it must be
  **quoted** in `.env` for the shell to export it correctly.

### Steps
```bash
# 1. Start the emulator. start-emulator.sh reads $LEDGER_EMULATOR_SEED from your shell, and the
#    `-v ./apps` mount is relative, so run it from the ledger-emulator/ directory.
cd e2e-playwright-tests/ledger-emulator

# export the repo-root .env into this shell
set -a; source ../../.env; set +a      
./start-emulator.sh

# 2. (optional) Verify the emulator is reachable.
cd ..                                   
yarn exec ts-node ./ledger-emulator/ledger-emulator-health-check.ts

# 3. Run the Ledger suite.
yarn ledger:tests

# 4. Stop the emulator when done (it was started with --rm, so stopping also removes it).
docker stop "$(docker ps -q --filter ancestor=speculos)"
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
