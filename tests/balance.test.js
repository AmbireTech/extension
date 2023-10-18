const puppeteer = require('puppeteer');
// let browser, page;
// const select = require('puppeteer-select');


let puppeteerArgs = [
    // `--disable-extensions-except=${__dirname}`,
    `--load-extension=${__dirname}/webkit-prod`,
    '--disable-features=DialMediaRouteProvider',
    // '--enable-automation'
    // '--detectOpenHandles',
    // '--start-maximized'
];

async function bootstrap(options = {}) {
    const { devtools = false, slowMo = 50 } = options

    const browser = await puppeteer.launch({
        headless: false,
        devtools,
        args: puppeteerArgs,
        defaultViewport: null,
        ...(slowMo && { slowMo })
    })


    const targets = await browser.targets()
    const extensionTarget = targets.find((target) => target.url().includes('chrome-extension'))
    const partialExtensionUrl = extensionTarget.url() || ''
    const [, , extensionId] = partialExtensionUrl.split('/')

    const page = await browser.newPage()
    const createVaultUrl = `chrome-extension://${extensionId}/tab.html#/keystore-unlock`
    await page.goto(createVaultUrl, { waitUntil: 'load' })



    const executionContext = await page.mainFrame().executionContext()
    await executionContext.evaluate(() => {

        const keyStore = "{\n    \"accounts\": \"[{\\\"addr\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\"],\\\"creation\\\":null,\\\"usedOnNetworks\\\":[{\\\"id\\\":\\\"polygon\\\",\\\"name\\\":\\\"Polygon\\\",\\\"nativeAssetSymbol\\\":\\\"MATIC\\\",\\\"rpcUrl\\\":\\\"https://rpc.ankr.com/polygon\\\",\\\"rpcNoStateOverride\\\":false,\\\"chainId\\\":{\\\"$bigint\\\":\\\"137\\\"}}]},{\\\"addr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\"],\\\"creation\\\":{\\\"factoryAddr\\\":\\\"0xA3A22Bf212C03ce55eE7C3845D4c177a6fEC418B\\\",\\\"bytecode\\\":\\\"0x60017fbacd3e9e8aed42b26f997f28d90ae31f73d67222ec769cf7d8552e5f95f8f48d553d602d80602e3d3981f3363d3d373d3d3d363d73ff69afde895b381ee71e17c60350ae4c70b16a925af43d82803e903d91602b57fd5bf3\\\",\\\"salt\\\":\\\"0x0000000000000000000000000000000000000000000000000000000000000000\\\"},\\\"usedOnNetworks\\\":[]},{\\\"addr\\\":\\\"0x77777777789A8BBEE6C64381e5E89E501fb0e4c8\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[],\\\"creation\\\":{\\\"factoryAddr\\\":\\\"0xBf07a0Df119Ca234634588fbDb5625594E2a5BCA\\\",\\\"bytecode\\\":\\\"0x7f00000000000000000000000000000000000000000000000000000000000000017f02c94ba85f2ea274a3869293a0a9bf447d073c83c617963b0be7c862ec2ee44e553d602d80604d3d3981f3363d3d373d3d3d363d732a2b85eb1054d6f0c6c2e37da05ed3e5fea684ef5af43d82803e903d91602b57fd5bf3\\\",\\\"salt\\\":\\\"0x2ee01d932ede47b0b2fb1b6af48868de9f86bfc9a5be2f0b42c0111cf261d04c\\\"}},{\\\"addr\\\":\\\"0xc4A6bB5139123bD6ba0CF387828a9A3a73EF8D1e\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[],\\\"creation\\\":{\\\"factoryAddr\\\":\\\"0xBf07a0Df119Ca234634588fbDb5625594E2a5BCA\\\",\\\"bytecode\\\":\\\"0x7f00000000000000000000000000000000000000000000000000000000000000017f120996493a7716bd46dc765d888c8b1263e37258defb48689b35843ee53bd9d6553d602d80604d3d3981f3363d3d373d3d3d363d732a2b85eb1054d6f0c6c2e37da05ed3e5fea684ef5af43d82803e903d91602b57fd5bf3\\\",\\\"salt\\\":\\\"0x0000000000000000000000000000000000000000000000000000000000000001\\\"}},{\\\"addr\\\":\\\"0x0F83537CE8259aB9C252CF4D6E01423f30d142D3\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[\\\"0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\"],\\\"creation\\\":{\\\"factoryAddr\\\":\\\"0xA3A22Bf212C03ce55eE7C3845D4c177a6fEC418B\\\",\\\"bytecode\\\":\\\"0x60017f14f1ee48ffeb014b2e48c51fc53e62c2ae20b14663fb23b89ff3f7e6e63f7206553d602d80602e3d3981f3363d3d373d3d3d363d73ff69afde895b381ee71e17c60350ae4c70b16a925af43d82803e903d91602b57fd5bf3\\\",\\\"salt\\\":\\\"0x0000000000000000000000000000000000000000000000000000000000000000\\\"},\\\"usedOnNetworks\\\":[{\\\"id\\\":\\\"optimism\\\",\\\"name\\\":\\\"Optimism\\\",\\\"nativeAssetSymbol\\\":\\\"ETH\\\",\\\"rpcUrl\\\":\\\"https://rpc.ankr.com/optimism\\\",\\\"rpcNoStateOverride\\\":false,\\\"chainId\\\":{\\\"$bigint\\\":\\\"10\\\"},\\\"erc4337\\\":{\\\"enabled\\\":true,\\\"entryPointAddr\\\":\\\"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789\\\",\\\"entryPointMarker\\\":\\\"0x42144640c7cb5ff8aa9595ae175ffcb6dd152db6e737c13cc2d5d07576967020\\\"}},{\\\"id\\\":\\\"polygon\\\",\\\"name\\\":\\\"Polygon\\\",\\\"nativeAssetSymbol\\\":\\\"MATIC\\\",\\\"rpcUrl\\\":\\\"https://rpc.ankr.com/polygon\\\",\\\"rpcNoStateOverride\\\":false,\\\"chainId\\\":{\\\"$bigint\\\":\\\"137\\\"},\\\"erc4337\\\":{\\\"enabled\\\":true,\\\"entryPointAddr\\\":\\\"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789\\\",\\\"entryPointMarker\\\":\\\"0x42144640c7cb5ff8aa9595ae175ffcb6dd152db6e737c13cc2d5d07576967020\\\"}}],\\\"eoaAddress\\\":\\\"0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\",\\\"slot\\\":2,\\\"isLinked\\\":false},{\\\"addr\\\":\\\"0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[\\\"0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\"],\\\"creation\\\":null,\\\"usedOnNetworks\\\":[{\\\"id\\\":\\\"polygon\\\",\\\"name\\\":\\\"Polygon\\\",\\\"nativeAssetSymbol\\\":\\\"MATIC\\\",\\\"rpcUrl\\\":\\\"https://rpc.ankr.com/polygon\\\",\\\"rpcNoStateOverride\\\":false,\\\"chainId\\\":{\\\"$bigint\\\":\\\"137\\\"},\\\"erc4337\\\":{\\\"enabled\\\":true,\\\"entryPointAddr\\\":\\\"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789\\\",\\\"entryPointMarker\\\":\\\"0x42144640c7cb5ff8aa9595ae175ffcb6dd152db6e737c13cc2d5d07576967020\\\"}}],\\\"eoaAddress\\\":\\\"0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\",\\\"slot\\\":2,\\\"isLinked\\\":false},{\\\"addr\\\":\\\"0x0ace96748e66F42EBeA22D777C2a99eA2c83D8A6\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[\\\"0xDe3D61Ae274aA517E01b96ff5155F70883Bc877c\\\"],\\\"creation\\\":{\\\"factoryAddr\\\":\\\"0xA3A22Bf212C03ce55eE7C3845D4c177a6fEC418B\\\",\\\"bytecode\\\":\\\"0x60017f0b92e28b916fec7d153939d2e69b79e217a3b6dadde1bbef0eab74796b4710e8553d602d80602e3d3981f3363d3d373d3d3d363d73ff69afde895b381ee71e17c60350ae4c70b16a925af43d82803e903d91602b57fd5bf3\\\",\\\"salt\\\":\\\"0x0000000000000000000000000000000000000000000000000000000000000000\\\"},\\\"usedOnNetworks\\\":[{\\\"id\\\":\\\"optimism\\\",\\\"name\\\":\\\"Optimism\\\",\\\"nativeAssetSymbol\\\":\\\"ETH\\\",\\\"rpcUrl\\\":\\\"https://rpc.ankr.com/optimism\\\",\\\"rpcNoStateOverride\\\":false,\\\"chainId\\\":{\\\"$bigint\\\":\\\"10\\\"},\\\"erc4337\\\":{\\\"enabled\\\":true,\\\"entryPointAddr\\\":\\\"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789\\\",\\\"entryPointMarker\\\":\\\"0x42144640c7cb5ff8aa9595ae175ffcb6dd152db6e737c13cc2d5d07576967020\\\"}},{\\\"id\\\":\\\"polygon\\\",\\\"name\\\":\\\"Polygon\\\",\\\"nativeAssetSymbol\\\":\\\"MATIC\\\",\\\"rpcUrl\\\":\\\"https://rpc.ankr.com/polygon\\\",\\\"rpcNoStateOverride\\\":false,\\\"chainId\\\":{\\\"$bigint\\\":\\\"137\\\"},\\\"erc4337\\\":{\\\"enabled\\\":true,\\\"entryPointAddr\\\":\\\"0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789\\\",\\\"entryPointMarker\\\":\\\"0x42144640c7cb5ff8aa9595ae175ffcb6dd152db6e737c13cc2d5d07576967020\\\"}}],\\\"eoaAddress\\\":\\\"0xDe3D61Ae274aA517E01b96ff5155F70883Bc877c\\\",\\\"slot\\\":3,\\\"isLinked\\\":false},{\\\"addr\\\":\\\"0xDe3D61Ae274aA517E01b96ff5155F70883Bc877c\\\",\\\"label\\\":\\\"\\\",\\\"pfp\\\":\\\"\\\",\\\"associatedKeys\\\":[\\\"0xDe3D61Ae274aA517E01b96ff5155F70883Bc877c\\\"],\\\"creation\\\":null,\\\"usedOnNetworks\\\":[],\\\"eoaAddress\\\":\\\"0xDe3D61Ae274aA517E01b96ff5155F70883Bc877c\\\",\\\"slot\\\":3,\\\"isLinked\\\":false}]\",\n    \"ambire_extension_state\": \"[]\",\n    \"banners\": \"[]\",\n    \"keyStoreUid\": \"a2c13f1c416421e22b584fe665c2f84b\",\n    \"keystoreKeys\": \"[{\\\"id\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"type\\\":\\\"internal\\\",\\\"label\\\":\\\"Imported key on 8/25/2023\\\",\\\"privKey\\\":\\\"0x8139476979cd54c42ab56d1673e30aebf61e6c287167a7ff67d7861276dac446\\\",\\\"meta\\\":null},{\\\"id\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"type\\\":\\\"internal\\\",\\\"label\\\":\\\"Imported key on 8/25/2023\\\",\\\"privKey\\\":\\\"0x8139476979cd54c42ab56d1673e30aebf61e6c287167a7ff67d7861276dac446\\\",\\\"meta\\\":null},{\\\"id\\\":\\\"0xb9f0ecb2407b65017E6558C09080b8E738c4334A\\\",\\\"type\\\":\\\"internal\\\",\\\"label\\\":\\\"Imported key on 9/27/2023 for the account on slot 2\\\",\\\"privKey\\\":\\\"0xf70211ae2dadc630be0ae8b6f0cbe7e0c37290459742d051eb1c6e3ea09abaec\\\",\\\"meta\\\":null},{\\\"id\\\":\\\"0x963773571E95FF63fce38Ed101f972671CD40C75\\\",\\\"type\\\":\\\"internal\\\",\\\"label\\\":\\\"Imported key on 9/27/2023 for the account on slot 3\\\",\\\"privKey\\\":\\\"0x3e2b2342fc44b181495ee4b92a1722edf46788481694f6dad2926de92c717686\\\",\\\"meta\\\":null}]\",\n    \"keystoreSecrets\": \"[{\\\"id\\\":\\\"password\\\",\\\"scryptParams\\\":{\\\"salt\\\":\\\"0x95b94917cccedeb9be11bbaf86547def748204842caea2da3d35f93c323a24ee\\\",\\\"N\\\":131072,\\\"r\\\":8,\\\"p\\\":1,\\\"dkLen\\\":64},\\\"aesEncrypted\\\":{\\\"cipherType\\\":\\\"aes-128-ctr\\\",\\\"ciphertext\\\":\\\"0x057f26ca58cbf602530cf0a13530bfc01eec0f1ea742a4b1dc94c03d755f916f\\\",\\\"iv\\\":\\\"0xe0397e9ad06a7e1443864219a7288ba6\\\",\\\"mac\\\":\\\"0xe376ada2a180549c43491b42f89cc3946f9d493b70e1b145e1849dacb83ca04c\\\"}}]\",\n    \"navigationPaths\": \"[]\",\n    \"onboardingStatus\": \"on-boarded\",\n    \"permission\": \"{\\\"dumpCache\\\":[{\\\"k\\\":\\\"https://sigtool.ambire.com\\\",\\\"v\\\":{\\\"origin\\\":\\\"https://sigtool.ambire.com\\\",\\\"name\\\":\\\"SigTool for EVM\\\",\\\"icon\\\":\\\"https://sigtool.ambire.com/favicon.ico\\\",\\\"chainId\\\":1,\\\"isSigned\\\":true,\\\"isTop\\\":false,\\\"isConnected\\\":true},\\\"e\\\":0},{\\\"k\\\":\\\"https://app.uniswap.org\\\",\\\"v\\\":{\\\"origin\\\":\\\"https://app.uniswap.org\\\",\\\"name\\\":\\\"Uniswap Interface\\\",\\\"icon\\\":\\\"https://app.uniswap.org/favicon.png\\\",\\\"isSigned\\\":false,\\\"isTop\\\":false,\\\"isConnected\\\":true,\\\"chainId\\\":137},\\\"e\\\":0}]}\",\n    \"previousHints\": \"{\\\"ethereum:0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\":{\\\"erc20s\\\":[],\\\"erc721s\\\":{}},\\\"polygon:0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\":{\\\"erc20s\\\":[],\\\"erc721s\\\":{}},\\\"polygon:0x77777777789A8BBEE6C64381e5E89E501fb0e4c8\\\":{\\\"erc20s\\\":[\\\"0x564906ec1DF8399F00e4ad32c0eCAC0404a27A1c\\\"],\\\"erc721s\\\":{\\\"0x2f15CACfDC85E082b93d1F88cD8044E2e78251f3\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"111\\\"]},\\\"0x582f69f9084869A6FB022cbb3f0F9E338995cAC8\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"619\\\"]}}},\\\"ethereum:0x77777777789A8BBEE6C64381e5E89E501fb0e4c8\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0xba100000625a3754423978a60c9317c58a424e3D\\\",\\\"0x4da27a545c0c5B758a6BA100e3a049001de870f5\\\",\\\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\\\",\\\"0xB6456b57f03352bE48Bf101B46c1752a0813491a\\\",\\\"0x6B175474E89094C44Da98b954EedeAC495271d0F\\\",\\\"0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935\\\",\\\"0x6b175474e89094c44da98b954eedeac495271d0f\\\"],\\\"erc721s\\\":{}},\\\"polygon:0xc4A6bB5139123bD6ba0CF387828a9A3a73EF8D1e\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0xb33EaAd8d922B1083446DC23f610c2567fB5180f\\\",\\\"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174\\\",\\\"0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270\\\",\\\"0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619\\\",\\\"0x0B91B07bEb67333225A5bA0259D55AeE10E3A578\\\",\\\"0xc2132D05D31c914a87C6611C10748AEb04B58e8F\\\",\\\"0x2b88aD57897A8b496595925F43048301C37615Da\\\",\\\"0x6DdB31002abC64e1479Fc439692F7eA061e78165\\\",\\\"0xA1c57f48F0Deb89f569dFbE6E2B7f46D33606fD4\\\",\\\"0xEE800B277A96B0f490a1A732e1D6395FAD960A26\\\",\\\"0x85955046DF4668e1DD369D2DE9f3AEB98DD2A369\\\",\\\"0x564906ec1DF8399F00e4ad32c0eCAC0404a27A1c\\\",\\\"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270\\\",\\\"0x7ceb23fd6bc0add59e62ac25578270cff1b9f619\\\",\\\"0x8f3cf7ad23cd3cadbd9735aff958023239c6a063\\\",\\\"0x9c2C5fd7b07E95EE044DDeba0E97a665F142394f\\\",\\\"0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063\\\"],\\\"erc721s\\\":{\\\"0xcD4085809dA81E956990F8669Ef1b473a419eBE1\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"653\\\"]},\\\"0xEb0a6a3021E6cFDDFa72591A197Bb8acB102dADd\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"0\\\"]}}},\\\"ethereum:0xc4A6bB5139123bD6ba0CF387828a9A3a73EF8D1e\\\":{\\\"erc20s\\\":[\\\"0x88800092fF476844f74dC2FC427974BBee2794Ae\\\",\\\"0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935\\\",\\\"0xADE00C28244d5CE17D72E40330B1c318cD12B7c3\\\",\\\"0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84\\\",\\\"0x88ACDd2a6425c3FaAE4Bc9650Fd7E27e0Bebb7aB\\\",\\\"0x9E32b13ce7f2E80A01932B42553652E053D6ed8e\\\",\\\"0x82089a9c7c4a07352F7433fBce1D4Ee9a722fF29\\\",\\\"0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85\\\",\\\"0x4E15361FD6b4BB609Fa63C81A2be19d873717870\\\",\\\"0x8793Fb615Eb92822F482f88B3137B00aad4C00D2\\\",\\\"0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0\\\",\\\"0x429acA1cCd47296483D1281c85B24e842de0b758\\\",\\\"0x335F4e66B9B61CEE5CeaDE4e727FCEC20156B2F0\\\",\\\"0xe5ca70281149Be03Da30778fb5ec6183d339F7a5\\\",\\\"0x0000000000000000000000000000000000000000\\\",\\\"0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1\\\"],\\\"erc721s\\\":{\\\"0x932261f9Fc8DA46C4a22e31B45c4De60623848bF\\\":{\\\"isKnown\\\":true,\\\"tokens\\\":[\\\"37996\\\"]},\\\"0xD8FAf7d15782c60d71E55895F2419566643ba9BB\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"3034\\\"]},\\\"0x88610167E16935257770FBCcAe84f30ab083EeA2\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"2529\\\"]},\\\"0x615b05812DC1a603E39309Be0B46Ac30B01b4422\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"5306\\\",\\\"5307\\\",\\\"5308\\\",\\\"5310\\\"]}}},\\\"ethereum:0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\":{\\\"erc20s\\\":[],\\\"erc721s\\\":{}},\\\"optimism:0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\":{\\\"erc20s\\\":[],\\\"erc721s\\\":{}},\\\"polygon:0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\"],\\\"erc721s\\\":{}},\\\"optimism:0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\":{\\\"erc20s\\\":[],\\\"erc721s\\\":{}},\\\"optimism:0x77777777789A8BBEE6C64381e5E89E501fb0e4c8\\\":{\\\"erc20s\\\":[],\\\"erc721s\\\":{}},\\\"optimism:0xc4A6bB5139123bD6ba0CF387828a9A3a73EF8D1e\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0x4200000000000000000000000000000000000042\\\",\\\"0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1\\\",\\\"0x7F5c764cBc14f9669B88837ca1490cCa17c31607\\\",\\\"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58\\\",\\\"0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee\\\",\\\"0x625e7708f30ca75bfd92586e17077590c60eb4cd\\\",\\\"0x6ab707aca953edaefbc4fd23ba73294241490620\\\",\\\"0x078f358208685046a11c85e8ad32895ded33a249\\\",\\\"0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8\\\"],\\\"erc721s\\\":{\\\"0x18a1bC18cEfdc952121F319039502FDD5f48B6fF\\\":{\\\"isKnown\\\":false,\\\"tokens\\\":[\\\"47\\\"]}}},\\\"ethereum:0x0F83537CE8259aB9C252CF4D6E01423f30d142D3\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2\\\",\\\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\\\",\\\"0xdAC17F958D2ee523a2206206994597C13D831ec7\\\",\\\"0x6b175474e89094c44da98b954eedeac495271d0f\\\",\\\"0x4fabb145d64652a948d72533023f6e7a623c7c53\\\",\\\"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599\\\",\\\"0x88800092fF476844f74dC2FC427974BBee2794Ae\\\",\\\"0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935\\\",\\\"0x028171bca77440897b824ca71d1c56cac55b68a3\\\",\\\"0xbcca60bb61934080951369a648fb03df4f96263c\\\",\\\"0x3ed3b47dd13ec9a98b44e6204a523e766b225811\\\",\\\"0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656\\\",\\\"0x030ba81f1c18d280636f32af80b9aad02cf0854e\\\"],\\\"erc721s\\\":{}},\\\"polygon:0x0F83537CE8259aB9C252CF4D6E01423f30d142D3\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270\\\",\\\"0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6\\\",\\\"0x7ceb23fd6bc0add59e62ac25578270cff1b9f619\\\",\\\"0x8f3cf7ad23cd3cadbd9735aff958023239c6a063\\\",\\\"0xc2132D05D31c914a87C6611C10748AEb04B58e8F\\\",\\\"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174\\\",\\\"0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4\\\",\\\"0x27F8D03b3a2196956ED754baDc28D73be8830A6e\\\",\\\"0x1a13F4Ca1d028320A707D99520AbFefca3998b7F\\\",\\\"0x60D55F02A771d515e077c9C2403a1ef324885CeC\\\",\\\"0x5c2ed810328349100A66B82b78a1791B101C9D61\\\",\\\"0x28424507fefb6f7f8E9D3860F56504E4e5f5f390\\\",\\\"0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee\\\",\\\"0x625e7708f30ca75bfd92586e17077590c60eb4cd\\\",\\\"0x6ab707aca953edaefbc4fd23ba73294241490620\\\",\\\"0x078f358208685046a11c85e8ad32895ded33a249\\\",\\\"0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8\\\"],\\\"erc721s\\\":{}},\\\"optimism:0x0F83537CE8259aB9C252CF4D6E01423f30d142D3\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee\\\",\\\"0x625e7708f30ca75bfd92586e17077590c60eb4cd\\\",\\\"0x6ab707aca953edaefbc4fd23ba73294241490620\\\",\\\"0x078f358208685046a11c85e8ad32895ded33a249\\\",\\\"0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8\\\",\\\"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58\\\",\\\"0x7F5c764cBc14f9669B88837ca1490cCa17c31607\\\",\\\"0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1\\\"],\\\"erc721s\\\":{}},\\\"ethereum:0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2\\\",\\\"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\\\",\\\"0xdAC17F958D2ee523a2206206994597C13D831ec7\\\",\\\"0x6b175474e89094c44da98b954eedeac495271d0f\\\",\\\"0x4fabb145d64652a948d72533023f6e7a623c7c53\\\",\\\"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599\\\",\\\"0x88800092fF476844f74dC2FC427974BBee2794Ae\\\",\\\"0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935\\\",\\\"0x028171bca77440897b824ca71d1c56cac55b68a3\\\",\\\"0xbcca60bb61934080951369a648fb03df4f96263c\\\",\\\"0x3ed3b47dd13ec9a98b44e6204a523e766b225811\\\",\\\"0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656\\\",\\\"0x030ba81f1c18d280636f32af80b9aad02cf0854e\\\"],\\\"erc721s\\\":{}},\\\"optimism:0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee\\\",\\\"0x625e7708f30ca75bfd92586e17077590c60eb4cd\\\",\\\"0x6ab707aca953edaefbc4fd23ba73294241490620\\\",\\\"0x078f358208685046a11c85e8ad32895ded33a249\\\",\\\"0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8\\\",\\\"0x94b008aA00579c1307B0EF2c499aD98a8ce58e58\\\",\\\"0x7F5c764cBc14f9669B88837ca1490cCa17c31607\\\",\\\"0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1\\\"],\\\"erc721s\\\":{}},\\\"polygon:0xc7E32B118989296eaEa88D86Bd9041Feca77Ed36\\\":{\\\"erc20s\\\":[\\\"0x0000000000000000000000000000000000000000\\\",\\\"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174\\\",\\\"0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270\\\",\\\"0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6\\\",\\\"0x7ceb23fd6bc0add59e62ac25578270cff1b9f619\\\",\\\"0x8f3cf7ad23cd3cadbd9735aff958023239c6a063\\\",\\\"0xc2132D05D31c914a87C6611C10748AEb04B58e8F\\\",\\\"0x8dF3aad3a84da6b69A4DA8aeC3eA40d9091B2Ac4\\\",\\\"0x27F8D03b3a2196956ED754baDc28D73be8830A6e\\\",\\\"0x1a13F4Ca1d028320A707D99520AbFefca3998b7F\\\",\\\"0x60D55F02A771d515e077c9C2403a1ef324885CeC\\\",\\\"0x5c2ed810328349100A66B82b78a1791B101C9D61\\\",\\\"0x28424507fefb6f7f8E9D3860F56504E4e5f5f390\\\",\\\"0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee\\\",\\\"0x625e7708f30ca75bfd92586e17077590c60eb4cd\\\",\\\"0x6ab707aca953edaefbc4fd23ba73294241490620\\\",\\\"0x078f358208685046a11c85e8ad32895ded33a249\\\",\\\"0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8\\\"],\\\"erc721s\\\":{}}}\",\n    \"selectedAccount\": \"0x77777777789A8BBEE6C64381e5E89E501fb0e4c8\",\n    \"signedMessages\": \"{\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\":[{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495096839\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495147063\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495155797\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xa272e6bd8ecbd277a149ca42027787f50fddc6c38fa99436eaa79d044ff722f6146ffd7aad9111d2ff94080ad8dde6959f13201820fe7d887931df2cd9a94ada1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"typedMessage\\\",\\\"types\\\":{\\\"Permit\\\":[{\\\"name\\\":\\\"owner\\\",\\\"type\\\":\\\"address\\\"},{\\\"name\\\":\\\"spender\\\",\\\"type\\\":\\\"address\\\"},{\\\"name\\\":\\\"value\\\",\\\"type\\\":\\\"uint256\\\"},{\\\"name\\\":\\\"nonce\\\",\\\"type\\\":\\\"uint256\\\"},{\\\"name\\\":\\\"deadline\\\",\\\"type\\\":\\\"uint256\\\"}]},\\\"domain\\\":{\\\"name\\\":\\\"USD Coin\\\",\\\"version\\\":\\\"2\\\",\\\"chainId\\\":\\\"1\\\",\\\"verifyingContract\\\":\\\"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48\\\"},\\\"message\\\":{\\\"owner\\\":\\\"0x39276bafab2d0284d7db1e77673561beff05ebd0\\\",\\\"spender\\\":\\\"0x0000000000000000000000000000000000000000\\\",\\\"value\\\":\\\"133700\\\",\\\"nonce\\\":\\\"0\\\",\\\"deadline\\\":\\\"115792089237316195423570985008687907853269984665640564039457584007913129639935\\\"}}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495437271\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495546704\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495727545\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495855089\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495913737\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0xbc8fa4cc68c819023f7a7902696f5e49cd6960b764b574c1a49c9994172aeb5828b28c0997bd7d565127d2b736bae5285f33f54b8d042a8f443f16f8ae7408f01c\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x0001\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693911201569\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0x5b2dce98c7179051d21407be04bcd088243cd388ed51c4c64ccae115ca8787d85cff933dcde45220c3adfcc40f7958305e195dbd4c54580dfbf61e43438cbe9a1c\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693911239616\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0x5b2dce98c7179051d21407be04bcd088243cd388ed51c4c64ccae115ca8787d85cff933dcde45220c3adfcc40f7958305e195dbd4c54580dfbf61e43438cbe9a1c\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1695037994573\\\"},\\\"accountAddr\\\":\\\"0x39276bafaB2d0284D7db1E77673561bEFF05EBd0\\\",\\\"signature\\\":\\\"0x76ca9fa27b349334e7fd26cab6372759cf540cc1486cba8cc393a1c0950e4ffe555191d0587114b1e87c30ab2edefd9dd647cca7dd10efd5732ac79237167d3b1c\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x717765777165777165\\\"}}],\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\":[{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495295786\\\"},\\\"accountAddr\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"signature\\\":\\\"0xf1d05f30d6bd09028a94cb7af32bedfe902aa4708af45ccd1c2846ff1e6afedb5dfbac9e54de8147a3c6e5fce79a1c2124eb5729b9dae4cbe59b83fc3331f12b1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x7b0a2022646f6d61696e223a207b0a2020226e616d65223a202255534420436f696e222c0a202022636861696e4964223a20312c0a202022766572696679696e67436f6e7472616374223a2022307861306238363939316336323138623336633164313964346132653965623063653336303665623438222c0a20202276657273696f6e223a202232220a207d2c0a20227479706573223a207b0a2020225065726d6974223a205b0a2020207b0a20202020226e616d65223a20226f776e6572222c0a202020202274797065223a202261646472657373220a2020207d2c0a2020207b0a20202020226e616d65223a20227370656e646572222c0a202020202274797065223a202261646472657373220a2020207d2c0a2020207b0a20202020226e616d65223a202276616c7565222c0a202020202274797065223a202275696e74323536220a2020207d2c0a2020207b0a20202020226e616d65223a20226e6f6e6365222c0a202020202274797065223a202275696e74323536220a2020207d2c0a2020207b0a20202020226e616d65223a2022646561646c696e65222c0a202020202274797065223a202275696e74323536220a2020207d0a20205d0a207d2c0a20227072696d61727954797065223a20225065726d6974222c0a20226d657373616765223a207b0a2020226f776e6572223a2022307833393237366261666142326430323834443764623145373736373335363162454646303545426430222c0a2020227370656e646572223a2022307830303030303030303030303030303030303030303030303030303030303030303030303030303030222c0a20202276616c7565223a2022313333373030222c0a2020226e6f6e6365223a202230222c0a202022646561646c696e65223a2022307866666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666666220a207d0a7d\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495340875\\\"},\\\"accountAddr\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495379665\\\"},\\\"accountAddr\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693495781891\\\"},\\\"accountAddr\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}},{\\\"id\\\":{\\\"$bigint\\\":\\\"1693496979232\\\"},\\\"accountAddr\\\":\\\"0x9188fdd757Df66B4F693D624Ed6A13a15Cf717D7\\\",\\\"signature\\\":\\\"0xd94af3fed20bbdc842e0a1e3ebf17154843bd2b7aca0715da003b3aa8159de711a330a60505959161e8d2b5e3cc2999c16254e4e1498967fd64b233537f88c8e1b\\\",\\\"content\\\":{\\\"kind\\\":\\\"message\\\",\\\"message\\\":\\\"0x74657374\\\"}}]}\",\n    \"stepperState\": \"{\\\"currentStep\\\":-5,\\\"currentFlow\\\":\\\"legacy\\\"}\",\n    \"termsState\": \"{\\\"version\\\":\\\"1.0.0\\\",\\\"acceptedAt\\\":1692965030874}\"\n}"
        browser.storage.local.set(JSON.parse(keyStore))
    })

    const pages = await browser.pages()
    pages[0].close() // blank tab
    pages[1].close() // tab always opened after extension installation
    pages[2].close() // tab always opened after extension installation

    return {
        browser,
        page,
        pages,
        extensionRootUrl: `chrome-extension://${extensionId}`,
        extensionId
    }
}


describe('balance', () => {

    let browser
    let page
    let pages
    let extensionRootUrl

    beforeEach(async () => {
        const context = await bootstrap()
        page = context.page
        pages = context.pages
        browser = context.browser
        extensionRootUrl = context.extensionRootUrl
        extensionId = context.extensionId
    })

    // afterEach(async () => {
    //     browser.close();
    // })

    //--------------------------------------------------------------------------------------------------------------
    it('check the balance in account ', (async () => {
        await new Promise((r) => setTimeout(r, 500));

        page = await browser.newPage();
        await page.goto(`${extensionRootUrl}/tab.html#/keystore-unlock`, { waitUntil: 'load', })
        // await new Promise((r) => setTimeout(r, 500));
        /* Reload the page */
        await page.evaluate(() => {
            location.reload(true)
        })
        pages = await browser.pages()
        pages[1].close() // tab always opened after extension installation
        // console.log('====>', page.url())

        /*Type keystore password */
        const pass = 'test1234'
        await page.waitForSelector('[placeholder="Passphrase"]');
        const keyStorePassField = await page.$('[placeholder="Passphrase"]');
        await keyStorePassField.type(pass);

        await new Promise((r) => setTimeout(r, 1000))

        const keyStoreUnlokeButton = await page.waitForSelector('xpath///div[contains(text(), "Unlock")]');
        await keyStoreUnlokeButton.click();

        await new Promise((r) => setTimeout(r, 2000))

        /* Get the available balance */
        const availableAmmount = await page.evaluate(() => {
            const balance = document.querySelectorAll('[class="css-175oi2r r-18u37iz"]')
            return balance[1].innerText
        })


        // const button = await page.waitForSelector('xpath///div[contains(text(), "Balance")]');

        // const el = await page.waitForSelector("text/Balance");

        // console.log(buttonText)

        let availableAmmountNum = availableAmmount.replace(/\n/g, "");
         availableAmmountNum = availableAmmountNum.split('$')[1]
        console.log('available ammount is ' + availableAmmountNum)

        /* Verify that the balance is bigger than 0 */
        expect(parseFloat(availableAmmountNum) > 0).toBeTruthy();
    }));


    //--------------------------------------------------------------------------------------------------------------
    it('check if networks Ethereum, USDC and Polygon exist in the account  ', (async () => {
        await new Promise((r) => setTimeout(r, 500));

        page = await browser.newPage();
        await page.goto(`${extensionRootUrl}/tab.html#/keystore-unlock`, { waitUntil: 'load', })
        // await new Promise((r) => setTimeout(r, 500));
        /* Reload the page */
        await page.evaluate(() => {
            location.reload(true)
        })
        pages = await browser.pages()
        pages[1].close() // tab always opened after extension installation
        // console.log('====>', page.url())

        /*Type keystore password */
        const pass = 'test1234'
        await page.waitForSelector('[placeholder="Passphrase"]');
        const keyStorePassField = await page.$('[placeholder="Passphrase"]');
        await keyStorePassField.type(pass);

        await new Promise((r) => setTimeout(r, 1000))

        const keyStoreUnlokeButton = await page.waitForSelector('xpath///div[contains(text(), "Unlock")]');
        await keyStoreUnlokeButton.click();

        await new Promise((r) => setTimeout(r, 2000))


        /* Verify that USDC, ETH, WALLET */
        const text = await page.$eval('*', el => el.innerText);
        
        expect(text).toContain('USDC');
        console.log('USDC exist on the page')
        expect(text).toContain('ETH');
        console.log('ETH exist on the page')
        expect(text).toContain('WALLET');
        console.log('WALLET exist on the page')

    }));


    //--------------------------------------------------------------------------------------------------------------
    it('check if item exist in Collectibles tab', (async () => {
        await new Promise((r) => setTimeout(r, 500));

        page = await browser.newPage();
        await page.goto(`${extensionRootUrl}/tab.html#/keystore-unlock`, { waitUntil: 'load', })
        // await new Promise((r) => setTimeout(r, 500));
        /* Reload the page */
        await page.evaluate(() => {
            location.reload(true)
        })
        pages = await browser.pages()
        pages[1].close() // tab always opened after extension installation
        // console.log('====>', page.url())

        /*Type keystore password */
        const pass = 'test1234'
        await page.waitForSelector('[placeholder="Passphrase"]');
        const keyStorePassField = await page.$('[placeholder="Passphrase"]');
        await keyStorePassField.type(pass);

        await new Promise((r) => setTimeout(r, 1000))

        const keyStoreUnlokeButton = await page.waitForSelector('xpath///div[contains(text(), "Unlock")]');
        await keyStoreUnlokeButton.click();

        await new Promise((r) => setTimeout(r, 2000))
        
        /* Click on "Collectibles" button */
        const collectiblesButton = await page.waitForSelector('xpath///div[contains(text(), "Collectibles")]');
      


        await Promise.all([
            await collectiblesButton.click(),
            page.waitForNavigation()
          ]);

        
        /* Get the text content of the first item */
        let firstCollectiblesItem = await page.$$eval('[class="css-175oi2r r-1loqt21 r-1otgn73 r-1awozwy r-42olwf r-1q9bdsx r-rs99b7 r-18u37iz r-1wtj0ep r-1uu6nss"]', element => {
            return element[0].textContent
        });
        let firstCollectiblesItemCut = firstCollectiblesItem.split(' ')[0]

        /* Click on the first item */
        let elements = await page.$$('[class="css-175oi2r r-1loqt21 r-1otgn73 r-1awozwy r-42olwf r-1q9bdsx r-rs99b7 r-18u37iz r-1wtj0ep r-1uu6nss"]');
        // loop trough items          
        for (let i = 0; i < elements.length; i++) {

            let text = await page.evaluate(el => el.innerText, elements[i]);
            if (text.indexOf(firstCollectiblesItemCut) > -1) {
                await elements[i].click();
            }
        }
        /* Verify that the correct url os loaded */
        const url = page.url()
        expect(url).toContain('collection');


        /* Verify that selected item exist on the page */
        const text = await page.$eval('*', el => el.innerText);
        expect(text).toContain(firstCollectiblesItemCut);
    }));
})