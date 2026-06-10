function categorizeRequests(requests: string[]) {
  const thirdPartyExactMatchAllowlist = [
    'https://api.github.com/repos/MetaMask/eth-phishing-detect/contents/src/config.json?ref=main',
    'https://api.github.com/repos/phantom/blocklist/contents/blocklist.yaml?ref=master',
    'https://raw.githubusercontent.com/phantom/blocklist/master/blocklist.yaml',
    'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json',
    'http://localhost:5000/apdu',
    'http://localhost:5000/events'
  ]
  const thirdPartyHostsAllowList = [
    // Bundles
    'api.pimlico.io',
    'api.gelato.digital',
    'bundler.biconomy.io',
    // Swap & Bridge quotes
    'li.quest',
    'dedicated-backend.bungee.exchange',
    'trade-api.gateway.uniswap.org',
    // RPCs
    '480.rpc.thirdweb.com',
    'unichain-rpc.publicnode.com',
    'rpc.soniclabs.com',
    'opbnb-rpc.publicnode.com',
    'linea-rpc.publicnode.com',
    'rpc-qnd.inkonchain.com',
    'rpc.gnosischain.com',
    'forno.celo.org',
    'rpc.blast.io',
    'bepolia.rpc.berachain.com',
    'rpc.berachain-apis.com',
    'rpc.plasma.to',
    'api.llama.fi',
    'api.llama.fi',
    'base-mainnet.public.blastapi.io',
    'rpc.monad.xyz',
    'api.gelato.cloud',
    'ledger.com',
    'rpc.mainnet.citrea.xyz',
    'crypto-assets-service.api.ledger.com',
    'nft.api.live.ledger.com',
    'challenges.cloudflare.com',
    // Token images
    'static.debank.com'
  ]

  const reqs = requests.reduce(
    (acc, urlStr) => {
      const url = new URL(urlStr)
      const isAmbire = url.hostname.endsWith('.ambire.com')
      const isThirdPartyAllowed =
        thirdPartyExactMatchAllowlist.includes(urlStr) ||
        thirdPartyHostsAllowList.includes(url.hostname)

      if (url.hostname === 'relayer.ambire.com' && url.pathname.includes('/multi-hints')) {
        acc.hints.push(urlStr)
      } else if (url.hostname === 'cena.ambire.com' && url.pathname.includes('/simple/price')) {
        acc.nativePrices.push(urlStr)
      } else if (
        url.hostname === 'cena.ambire.com' &&
        url.pathname.includes('/simple/token_price')
      ) {
        acc.batchedPrices.push(urlStr)
      } else if (url.hostname === 'invictus.ambire.com') {
        acc.rpc.push(urlStr)
      } else if (isThirdPartyAllowed) {
        acc.thirdParty.push(urlStr)
      } else if (isAmbire) {
        acc.allowedUncategorized.push(urlStr)
      } else {
        acc.uncategorized.push(urlStr)
      }

      return acc
    },
    {
      // Allowed requests
      nativePrices: [],
      batchedPrices: [],
      hints: [],
      rpc: [],
      thirdParty: [], // Explicitly whitelisted third-party URLs
      allowedUncategorized: [], // Ambire domains not matched by any known category

      // Uncategorized requests – should normally be empty; review carefully if any appear
      uncategorized: []
    }
  )

  if (reqs.uncategorized.length) {
    console.log(
      "⚠️ We've detected some uncategorized requests. Please review them carefully!" +
        ' If any are known and expected, make sure to include them in the appropriate categories above.',
      reqs.uncategorized
    )
  }

  return reqs
}

export { categorizeRequests }
