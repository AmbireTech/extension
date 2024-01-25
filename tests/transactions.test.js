const puppeteer = require('puppeteer');

import { bootStrap, typeText, clickOnElement, clickWhenClickable, confirmTransaction, typeSeedPhrase } from './functions.js';


describe('transactions', () => {

    let browser;
    let page;
    let extensionRootUrl;
    let extensionId;
    let parsedKeystoreAccounts, parsedKeystoreUID, parsedKeystoreKeys, parsedKeystoreSecrets, envOnboardingStatus, envPermission, envSelectedAccount, envTermState, parsedPreviousHints;

    let recipientField = '[data-testid="recepient-address-field"]';
    let amountField = '[data-testid="amount-field"]'


    beforeEach(async () => {
        /* Initialize browser and page using bootStrap */
        const context = await bootStrap({ headless: false, slowMo: 10 });
        browser = context.browser;
        page = context.page;
        extensionRootUrl = context.extensionRootUrl
        extensionId = context.extensionId
        extensionTarget = context.extensionTarget

        page = (await browser.pages())[0];
        let createVaultUrl = `chrome-extension://${extensionId}/tab.html#/keystore-unlock`
        await page.goto(createVaultUrl, { waitUntil: 'load' })

        parsedKeystoreAccounts = JSON.parse(process.env.KEYSTORE_ACCOUNTS_1)
        parsedKeystoreUID = (process.env.KEYSTORE_KEYSTORE_UID_1)
        parsedKeystoreKeys = JSON.parse(process.env.KEYSTORE_KEYS_1)
        parsedKeystoreSecrets = JSON.parse(process.env.KEYSTORE_SECRETS_1)
        envOnboardingStatus = (process.env.KEYSTORE_ONBOARDING_STATUS_1)
        envPermission = (process.env.KEYSTORE_PERMISSION_1)
        envSelectedAccount = (process.env.KEYSTORE_SELECTED_ACCOUNT_1)
        envTermState = (process.env.KEYSTORE_TERMSTATE_1)
        parsedPreviousHints = (process.env.KEYSTORE_PREVIOUSHINTS_1)

        const executionContext = await page.mainFrame().executionContext()
        const backgroundPage = await extensionTarget.page(); // Access the background page

        /*  interact with chrome.storage.local in the context of the extension's background page */
        await backgroundPage.evaluate(
            (
                parsedKeystoreAccounts,
                parsedKeystoreUID,
                parsedKeystoreKeys,
                parsedKeystoreSecrets,
                envOnboardingStatus,
                envPermission,
                envSelectedAccount,
                envTermState,
                parsedPreviousHints
            ) => {
                chrome.storage.local.set({
                    accounts: parsedKeystoreAccounts,
                    keyStoreUid: parsedKeystoreUID,
                    keystoreKeys: parsedKeystoreKeys,
                    keystoreSecrets: parsedKeystoreSecrets,
                    onboardingStatus: envOnboardingStatus,
                    permission: envPermission,
                    selectedAccount: envSelectedAccount,
                    termsState: envTermState,
                    previousHints: parsedPreviousHints
                });
            },
            parsedKeystoreAccounts,
            parsedKeystoreUID,
            parsedKeystoreKeys,
            parsedKeystoreSecrets,
            envOnboardingStatus,
            envPermission,
            envSelectedAccount,
            envTermState,
            parsedPreviousHints
        );

        await new Promise((r) => setTimeout(r, 2000));

        let pages = await browser.pages()
        pages[0].close() // blank tab
        pages[1].close() // tab always opened after extension installation

        await new Promise((r) => setTimeout(r, 2000));

        /*Open the page again to load the browser local storage */
        page = await browser.newPage();


        // Navigate to a specific URL if necessary
        await page.goto(`${extensionRootUrl}/tab.html#/keystore-unlock`, { waitUntil: 'load' });
        await new Promise((r) => setTimeout(r, 2000));

        pages = await browser.pages()
        // pages[0].close()
        pages[1].close()

        await page.evaluate(() => {
            location.reload(true)
        })
        
        await typeSeedPhrase(page,process.env.KEYSTORE_PASS_PHRASE_1)
    })

    afterEach(async () => {
        await browser.close();
    });

    //--------------------------------------------------------------------------------------------------------------
    it('Make valid transaction', (async () => {

        await new Promise((r) => setTimeout(r, 2000))

        /* Get the available balance */
        const availableAmmount = await page.evaluate(() => {
            const balance = document.querySelector('[data-testid="full-balance"]')
            return balance.innerText
        })

        let availableAmmountNum = availableAmmount.replace(/\n/g, "");
        availableAmmountNum = availableAmmountNum.split('$')[1]

        /* Verify that the balance is bigger than 0 */
        expect(parseFloat(availableAmmountNum) > 0).toBeTruthy();

        // await page.waitForSelector('[data-testid="dashboard-button-Send"]');
        /* Click on "Send" button */
        await clickOnElement(page, '[data-testid="dashboard-button-Send"]')

        /* Type the amount */
        await typeText(page, amountField, "0.0001")

        /* Type the adress of the recipient  */
        await typeText(page, recipientField, '0xC254b41be9582e45a2aCE62D5adD3F8092D4ea6C')

        await page.waitForXPath(`//div[contains(text(), "You're trying to send to an unknown address. If you're really sure, confirm using the checkbox below.")]`);

        await page.waitForSelector('[data-testid="checkbox"]')

        /* Check the checkbox "I confirm this address is not a Binance wallets...." */
        await clickOnElement(page, '[data-testid="confirm-address-checkbox"]')

        /* Check the checkbox "Confirm sending to a previously unknown address" */
        await clickOnElement(page, '[data-testid="checkbox"]')

        /* Click on "Send" button and cofirm transaction */
        await confirmTransaction(page, extensionRootUrl, browser, 'xpath///div[contains(text(), "Send")]')
    }));


    //--------------------------------------------------------------------------------------------------------------
    it('(-) Send matics greater than the available balance ', (async () => {

        await new Promise((r) => setTimeout(r, 2000))

        await page.goto(`${extensionRootUrl}/tab.html#/transfer`, { waitUntil: 'load', })

        await page.waitForSelector('[data-testid="max-available-ammount"]')
        /* Get the available balance */
        let maxAvailableAmmount = await page.evaluate(() => {
            const balance = document.querySelector('[data-testid="max-available-ammount"]')
            return balance.textContent
        })
        const balance1 = 1 + maxAvailableAmmount;

        /* Type the amount bigger than balance */
        await typeText(page, amountField, balance1)

        /* Verify that the message "The amount is greater than the asset's balance:" exist on the page */
        const targetText = "The amount is greater than the asset's balance:";
        // Wait until the specified text appears on the page
        await page.waitForFunction((text) => {
            const element = document.querySelector('body');
            return element && element.textContent.includes(text);
        }, {}, targetText);
    }));

    //--------------------------------------------------------------------------------------------------------------
    it('(-) Send matics to smart contract ', (async () => {

        await new Promise((r) => setTimeout(r, 2000))

        await page.goto(`${extensionRootUrl}/tab.html#/transfer`, { waitUntil: 'load', })

        /* Type the amount */
        await typeText(page, amountField, "0.0001")

        /* Type the adress of smart contract in the "Add Recipient" field */
        await typeText(page, recipientField, '0x4e15361fd6b4bb609fa63c81a2be19d873717870')

        /* Verify that the message "The amount is greater than the asset's balance:" exist on the page */
        const targetText = "You are trying to send tokens to a smart contract. Doing so would burn them.";
        // Wait until the specified text appears on the page
        await page.waitForFunction((text) => {
            const element = document.querySelector('body');
            return element && element.textContent.includes(text);
        }, {}, targetText)
    }));



    //--------------------------------------------------------------------------------------------------------------
    it('Send sign message ', (async () => {

        /* Allow permissions for read and write in clipboard */
        context = browser.defaultBrowserContext();
        context.overridePermissions('https://sigtool.ambire.com', ['clipboard-read', 'clipboard-write']);

        await new Promise((r) => setTimeout(r, 2000))
        await page.goto('https://sigtool.ambire.com/#dummyTodo', { waitUntil: 'load', })

        /* Click on 'connect wallet' button */
        await clickOnElement(page, 'button[class="button-connect"]')
        /* Select 'MetaMask' */
        await page.click('>>>[class^="name"]')

        /* Type message in the 'Message' field */
        let textMessage = 'text message'
        await typeText(page, '[placeholder="Message (Hello world)"]', textMessage)
        await new Promise((r) => setTimeout(r, 500))
        /* Click on "Sign" button */
        await clickOnElement(page, 'xpath///span[contains(text(), "Sign")]')

        // Wait for the new window to be created and switch to it 
        const newTarget = await browser.waitForTarget(target => target.url() === `${extensionRootUrl}/notification.html#/sign-message`);
        const newPage = await newTarget.page();
        /* Click on "Sign" button */
        await clickOnElement(newPage, '[data-testid="sign-button"]')
        await page.waitForSelector('.signatureResult-signature')
        /* Get the Message signature text */
        const messageSignature = await page.evaluate(() => {
            const message = document.querySelector('.signatureResult-signature')
            return message.textContent
        })

        /* !THIS IS NOT WORKING WITH PUPPETEER. IT CAN'T BE COPIED IN CLIPBOARD. THAT'S WHY copiedAddress 
        IS TAKEN FROM selectedAccount OBJECT IN LOCAL STORAGE! */
        /* Click on a button that triggers a copy to clipboard. */
        await page.click('.copyButton');

        let copiedAddress = envSelectedAccount
        /* Click on "Verify" tab */
        await clickOnElement(page, 'xpath///a[contains(text(), "Verify")]')
        /* Fill copied address in the Signer field */
        await typeText(page, '[placeholder="Signer address (0x....)"]', copiedAddress)
        /* Fill copied address in the Message field */
        await typeText(page, '[placeholder="Message (Hello world)"]', textMessage)
        /* Fill copied address in the Hexadecimal signature field */
        await typeText(page, '[placeholder="Hexadecimal signature (0x....)"]', messageSignature)

        /* Click on "Verify" button */
        await clickOnElement(page, '#verifyButton')

        /* Verify that sign message is valid*/
        const validateMessage = 'Signature is Valid';
        /* Wait until the 'Signature is Valid' text appears on the page */
        await page.waitForFunction((text) => {
            const element = document.querySelector('body');
            return element && element.textContent.includes(text);
        }, {}, validateMessage);
    }));



    //--------------------------------------------------------------------------------------------------------------
    it('Make valid swap ', (async () => {

        await new Promise((r) => setTimeout(r, 2000))
        await page.goto('https://app.uniswap.org/swap', { waitUntil: 'load', })

        /* Click on 'connect' button */
        await clickOnElement(page, '[data-testid="navbar-connect-wallet"]')
        /* Select 'MetaMask' */
        await clickOnElement(page, '[data-testid="wallet-option-EIP_6963_INJECTED"]')
        /* Click on 'Select token' and type 'USDC' and select 'USDC' token */
        await clickOnElement(page, 'xpath///span[contains(text(), "Select token")]')
        // await typeText(page, '[data-testid="token-search-input"]', 'USDC')
        await new Promise((r) => setTimeout(r, 500))
        await clickOnElement(page, '[data-testid="common-base-USDC"]')

        await new Promise((r) => setTimeout(r, 500))

        await typeText(page, '#swap-currency-output', '0.0001')

        const selector = '[data-testid="swap-button"]';
        await page.waitForSelector(selector);

        let isClickable = false;
        let hasInsufficientBalanceText = false;

        // Check every 500ms if the button is clickable for up to 4 seconds
        for (let i = 0; i < 8; i++) {
            isClickable = await page.evaluate(selector => {
                const element = document.querySelector(selector);
                return element && !element.disabled;
            }, selector);

            if (isClickable) break;
            await page.waitForTimeout(500); // Wait for 500ms before checking again
        }
        if (isClickable) {
            await page.click(selector);
        } else {
            hasInsufficientBalanceText = await page.evaluate(() => {
                const element = document.querySelector('[data-testid="swap-button"]');
                return element && element.textContent.includes('Insufficient MATIC balance');
            });
            if (hasInsufficientBalanceText) {
                throw new Error('Insufficient MATIC balance');
            }
        }
        await new Promise((r) => setTimeout(r, 500))
        /* Click on 'Confirm Swap' button and confirm transaction */
        await confirmTransaction(page, extensionRootUrl, browser, '[data-testid="confirm-swap-button"]')
    }));


    //--------------------------------------------------------------------------------------------------------------
    it('Add View-only account', (async () => {
        /* Click on "Account"  */
        await clickOnElement(page, '[data-testid="account-select"]')

        /* Click on "+ Add Account"  */
        await clickOnElement(page, '[data-testid="button"]')

        /* Seleck "Watch an address" */
        await clickOnElement(page, '[data-testid="add-address-Watch"]')

        let viewOnlyAddress = '0xC254b41be9582e45a8aCE62D5adD3F8092D4ea6C'
        await typeText(page, '[data-testid="view-only-address-field"]', viewOnlyAddress)

        /* Click on "Import View-Only Accounts" button*/
        await clickWhenClickable(page, '[data-testid="button"]')

        /* Click on "Account"  */
        await clickWhenClickable(page, '[ data-testid="account-select"]')

        /* Find the element containing the specified address */
        const addressElement = await page.$x(`//*[contains(text(), '${viewOnlyAddress}')]`);

        if (addressElement.length > 0) {
            /* Get the parent element of the element with the specified address */
            const parentElement = await addressElement[0].$x('..');

            if (parentElement.length > 0) {
                /* Get the text content of the parent element and all elements within it */
                const parentTextContent = await page.evaluate(element => {
                    const elements = element.querySelectorAll('*');
                    return Array.from(elements, el => el.textContent).join('\n');
                }, parentElement[0]);

                /* Verify that somewhere in the content there is the text 'View-only' */
                const containsViewOnly = parentTextContent.includes('View-only');

                if (containsViewOnly) {
                } else {
                    throw new Error('The content does not contain the text "View-only".');
                }
            }
        }
    }))
})
