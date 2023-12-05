const puppeteer = require('puppeteer');
const path = require('path')


import { bootStrap, setAmbKeyStoreForLegacy } from './functions.js';


describe('balance', () => {
    let browser;
    let page;
    let extensionRootUrl;
    let options;

    beforeEach(async () => {


        options = {
            devtools: false,
            slowMo: 10,
            // Add other options as needed
          };

        const context = await bootStrap(page, browser, options)
        // page = context.page
        // pages = context.pages
        browser = context.browser
        extensionRootUrl = context.extensionRootUrl
        extensionId = context.extensionId



        page = (await browser.pages())[0];
        const createVaultUrl = `chrome-extension://${extensionId}/tab.html#/get-started`
        await page.goto(createVaultUrl, { waitUntil: 'load' })

       await page.evaluate(() => {
             location.reload(true)
         })


        const pages = await browser.pages()
        // await new Promise((r) => setTimeout(r, 2000))

        // pages[0].close() // blank tab
        pages[1].close() // tab always opened after extension installation
        // pages[2].close() // tab always opened after extension installation


        await page.evaluate(() => {
            location.reload(true)
        })


        await setAmbKeyStoreForLegacy(page);
    })

    afterEach(async () => {
        browser.close();
    })

    //--------------------------------------------------------------------------------------------------------------
    it('login into legasy account with private key', (async () => {

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        const repeatPhrase = await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(process.env.PRIVATE_KEY_LEGACY_ACCOUNT, { delay: 10 });

        /* Click on Import Legacy account button. */
        await page.click('[data-testid="button-ext-signer-login-screen"]')
        await page.waitForSelector('xpath///div[contains(text(), "Pick Accounts To Import")]');
        await page.waitForSelector('[data-testid="account-checkbox"]');

        await new Promise((r) => setTimeout(r, 1000))

        /* Select one Smart account and one Smart account */
        await page.$$eval('div', element => {
            element.find((item) => item.textContent === "Smart Account").click()
        })
        /* Select one Legacy account and one Smart account */
        await page.$$eval('[data-testid="account-checkbox"]', element => {
            element[0].click()
        })

        /* Click on Import Accounts button*/
        const Button = await page.waitForSelector('xpath///div[contains(text(), "Import Accounts")]');
        await Button.click();

        /* Click on Save and Continue button */
        const SaveButton = await page.waitForSelector('xpath///div[contains(text(), "Save and Continue")]');
        await SaveButton.click();

        /* Check whether the text "How To Use Ambire Wallet" exists on the page  */
        const textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "How To Use Ambire Wallet").textContent
        });
        if (textContent) {
            console.log('Test is passed');
        }
    }));


    //------------------------------------------------------------------------------------------------------

    it('login into legasy account with phrase', (async () => {

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        const repeatPhrase = await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(process.env.PHRASE_LEGACY_ACCOUNT, { delay: 10 });

        /* Click on Import Legacy account button. */
        await page.click('[data-testid="button-ext-signer-login-screen"]')
        await page.waitForSelector('xpath///div[contains(text(), "Pick Accounts To Import")]');
        await page.waitForSelector('[data-testid="account-checkbox"]');

        await new Promise((r) => setTimeout(r, 1000))

        /* Select one Smart account and one Smart account */
        await page.$$eval('div', element => {
            element.find((item) => item.textContent === "Smart Account").click()
        })
        /* Select one Legacy account and one Smart account */
        await page.$$eval('[data-testid="account-checkbox"]', element => {
            element[0].click()
        })

        /* Click on Import Accounts button*/
        const Button = await page.waitForSelector('xpath///div[contains(text(), "Import Accounts")]');
        await Button.click();

        /* Click on Save and Continue button */
        const SaveButton = await page.waitForSelector('xpath///div[contains(text(), "Save and Continue")]');
        await SaveButton.click();

        /* Check whether the text "How To Use Ambire Wallet" exists on the page  */
        const textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "How To Use Ambire Wallet").textContent
        });
        if (textContent) {
            console.log('Test is passed');
        }
    }));



    //------------------------------------------------------------------------------------------------------
    it('(-)login into legasy account with invalid private key', (async () => {

        let privateKey = '0000000000000000000000000000000000000000000000000000000000000000'

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        const repeatPhrase = await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(privateKey, { delay: 10 });

        /* Check whether text "Invalid private key." exist on the page  */
        const textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "Invalid private key.").textContent
        });
        /* Check if the button is disabled. */
        let attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(privateKey + ' is invalid private key and button is disabled');
            }
        }
        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))


        privateKey = ''
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(privateKey, { delay: 10 });

        /* Check whether text "Invalid private key." exist on the page  */
        await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "Invalid private key.").textContent
        });
        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(privateKey + ' is invalid private key and button is disabled');
            }
        }
        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))

        privateKey = '00390ce7b96835258b010e25f9196bf4ddbff575b7c102546e9e40780118018'
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(privateKey, { delay: 10 });

        /* Check whether text "Invalid private key." exist on the page  */
        await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "Invalid private key.").textContent
        });
        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(privateKey + ' is invalid private key and button is disabled');
            }
        }

        await new Promise((r) => setTimeout(r, 1000))

        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))

        privateKey = '03#90ce7b96835258b019e25f9196bf4ddbff575b7c102546e9e40780118018'
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(privateKey, { delay: 10 });

        /* Check whether text "Invalid private key." exist on the page  */
        await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "Invalid private key.").textContent
        });
        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(privateKey + ' is invalid private key and button is disabled');
            }
        }
    }));

    //------------------------------------------------------------------------------------------------------

    it('(-)login into legasy account with invalid phrase', (async () => {

        let phrase1 = ''
        let textContent

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        const repeatPhrase = await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(phrase1, { delay: 10 });


        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (attr == "true") {
            console.log('THE BUTTON IS DISABLED WITH EMPTY PHRASE');
        }

        phrase1 = 'allow survey plan weasel exhibit helmet industry bunker fish step garlic slice sss'

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(phrase1, { delay: 10 });

        /* Check whether text "A seed phrase must be 12-24 words long." exist on the page  */
        textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "A seed phrase must be 12-24 words long.").textContent
        });

        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(phrase1 + '---TOO LONG PHRASE. ERROR IS--- ' + textContent);
            }
        }
        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))

        phrase1 = 'allow survey play weasel exhibit helmet industry bunker fish step garlic'

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(phrase1, { delay: 10 });

        /* Check whether text "A seed phrase must be 12-24 words long." exist on the page  */
        textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "A seed phrase must be 12-24 words long.").textContent
        });

        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(phrase1 + '---TOO SHORT PHRASE. ERROR IS--- ' + textContent);
            }
        }
        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))


        phrase1 = 'allow survey allow survey allow survey allow survey allow survey allow survey'

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(phrase1, { delay: 10 });

        /* Check whether text "A seed phrase must be 12-24 words long." exist on the page  */
        textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "Your seed phrase length is valid, but a word is misspelled.").textContent
        });

        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(phrase1 + '---INVALID PHRASE. ERROR IS--- ' + textContent);
            }
        }
        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))


        phrase1 = '00000 000000 00000 000000 00000 000000 00000 000000 00000 000000 00000 000000'

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(phrase1, { delay: 10 });

        /* Check whether text "A seed phrase must be 12-24 words long." exist on the page  */
        textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "Your seed phrase length is valid, but a word is misspelled.").textContent
        });

        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(phrase1 + '---INVALID PHRASE. ERROR IS--- ' + textContent);
            }
        }
        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))

        phrase1 = 'allow survey play weasel exhibit helmet industry bunker fish step garlic ababa'

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(phrase1, { delay: 10 });

        /* Check whether text "A seed phrase must be 12-24 words long." exist on the page  */
        textContent = await page.$$eval('div[dir="auto"]', element => {
            return element.find((item) => item.textContent === "Your seed phrase length is valid, but a word is misspelled.").textContent
        });

        /* Check if the button is disabled. */
        attr = await page.$$eval('[data-testid="button-ext-sighner-login-screen"]', el => el.map(x => x.getAttribute("aria-disabled")));
        if (textContent) {
            if (attr == "true") {
                console.log(phrase1 + '---INVALID WORD IN PHRASE. ERROR IS--- ' + textContent);
            }
        }
        await page.$eval('[placeholder="Enter a seed phrase or private key"]', (el) => (el.value = ''))

    }));

    //--------------------------------------------------------------------------------------------------------------
    it('check selected accounts when you are logged in', (async () => {

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        const repeatPhrase = await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(process.env.PRIVATE_KEY_LEGACY_ACCOUNT, { delay: 10 });

        /* Click on Import Legacy account button. */
        await page.click('[data-testid="button-ext-signer-login-screen"]')
        await page.waitForSelector('xpath///div[contains(text(), "Pick Accounts To Import")]');
        await page.waitForSelector('[data-testid="account-checkbox"]');

        await new Promise((r) => setTimeout(r, 1000))

        /* Select one Legacy account and one Smart account */
        let firstSelectedLegacyAccount = await page.$$eval('[data-testid="account-checkbox"]', element => {
            element[0].click()
            return element[0].textContent
        })
        /* Keep the first and the last part of the address and use it later for verification later */
         firstSelectedLegacyAccount1 = firstSelectedLegacyAccount.slice(0,15)  
         firstSelectedLegacyAccount2 = firstSelectedLegacyAccount.slice(18, firstSelectedLegacyAccount.length) 

        let firstSelectedSmartAccount = await page.$$eval('[data-testid="account-checkbox"]', element => {
            element[1].click()
            return element[1].textContent
        })

        firstSelectedSmartAccount1 = firstSelectedSmartAccount.slice(0,15); 
        firstSelectedSmartAccount2 = firstSelectedSmartAccount.slice(18, firstSelectedSmartAccount.length);

        /* Click on Import Accounts button*/
        const Button = await page.waitForSelector('xpath///div[contains(text(), "Import Accounts")]');
        await Button.click();

        /* Click on Save and Continue button */
        const SaveButton = await page.waitForSelector('xpath///div[contains(text(), "Save and Continue")]');
        await SaveButton.click();

        // /* Check whether the text "How To Use Ambire Wallet" exists on the page  */
        // const textContent = await page.$$eval('div[dir="auto"]', element => {
        //     return element.find((item) => item.textContent === "How To Use Ambire Wallet").textContent
        // });
        
        /* Move to account select page */
        await page.goto(`${extensionRootUrl}/tab.html#/account-select`, { waitUntil: 'load', })

        /* Verify that selected accounts exist on the page */
        const text = await page.$eval('*', el => el.innerText);
        expect(text).toContain(firstSelectedLegacyAccount1);
        expect(text).toContain(firstSelectedLegacyAccount2);

        expect(text).toContain(firstSelectedSmartAccount1);
        expect(text).toContain(firstSelectedSmartAccount2);

    }));

    //--------------------------------------------------------------------------------------------------------------
    it('change selected account name', (async () => {

        await page.waitForSelector('[placeholder="Enter a seed phrase or private key"]');
        const repeatPhrase = await page.$('[placeholder="Enter a seed phrase or private key"]');
        await repeatPhrase.type(process.env.PRIVATE_KEY_LEGACY_ACCOUNT, { delay: 10 });

        /* Click on Import Legacy account button. */
        await page.click('[data-testid="button-ext-signer-login-screen"]')
        await page.waitForSelector('xpath///div[contains(text(), "Pick Accounts To Import")]');
        await page.waitForSelector('[data-testid="account-checkbox"]');

        await new Promise((r) => setTimeout(r, 1000))

        /* Select one Legacy account and one Smart account */
        let firstSelectedLegacyAccount = await page.$$eval('[data-testid="account-checkbox"]', element => {
            element[0].click()        })

        let firstSelectedSmartAccount = await page.$$eval('[data-testid="account-checkbox"]', element => {
            element[1].click()        })

        /* Click on Import Accounts button*/
        const Button = await page.waitForSelector('xpath///div[contains(text(), "Import Accounts")]');
        await Button.click();

        let accountName1 = 'Test-Account-1'
        let accountName2 = 'Test-Account-2'

        /* Change the names of the chosen accounts */
        await page.waitForSelector('[value="Account 1 (Legacy from Private Key)"]');
        const accountNameField1 = await page.$('[value="Account 1 (Legacy from Private Key)"]');
        await accountNameField1.click({ clickCount: 3 });
        await accountNameField1.press('Backspace');
        await accountNameField1.type(accountName1, { delay: 10 });

        const accountNameField2 = await page.$('[value="Account 2 (Ambire via Private Key)"]');
        await accountNameField2.click({ clickCount: 3 });
        await accountNameField2.press('Backspace');
        await accountNameField2.type(accountName2, { delay: 10 });
 
        /* Click on Save and Continue button */
        const SaveButton = await page.waitForSelector('xpath///div[contains(text(), "Save and Continue")]');
        await SaveButton.click();

        // /* Check whether the text "How To Use Ambire Wallet" exists on the page  */
        // const textContent = await page.$$eval('div[dir="auto"]', element => {
        //     return element.find((item) => item.textContent === "How To Use Ambire Wallet").textContent
        // });
    
        /* Move to account select page */
        await page.goto(`${extensionRootUrl}/tab.html#/account-select`, { waitUntil: 'load', })

        /* Verify that selected accounts exist on the page */
        const text = await page.$eval('*', el => el.innerText);
        expect(text).toContain(accountName1);
        expect(text).toContain(accountName2);
    }));


});
