import RNFS from 'react-native-fs'
import networks from 'ambire-common/src/constants/networks'

import { useEffect, useState } from 'react'
// TODO: fix path
import { DAPP_PROVIDER_URLS } from '@web/extension-services/inpage/config/dapp-providers'
import { isiOS } from '@common/config/env'
import eventEmitterScript from './EventEmitterScript'
import replaceMetamaskWithAmbireInDapps from './ReplaceMetamaskWithAmbireInDapps'

// Used in the injected EthereumProvider
const IS_METAMASK = true

// Use for debugging only, inject this in the commonScript
// window.onerror = function(message, sourcefile, lineno, colno, error) {
//   alert("Message: " + message + " - Source: " + sourcefile + " Line: " + lineno + ":" + colno + " Error: " + JSON.stringify(error));
//   return true;
// };

const commonScript = `
  ${eventEmitterScript}
  ${replaceMetamaskWithAmbireInDapps}

  const networks = ${JSON.stringify(networks)};
  const DAPP_PROVIDER_URLS = ${JSON.stringify(DAPP_PROVIDER_URLS)};
  const IS_METAMASK = ${IS_METAMASK};
`

// TODO: This is temporary, needed only for build #42, in order to fix the issue
// with an over the air update (provider string is part of the build). Remove
// this fix after the next build!
const temporaryBuild42fixForProviderOverridingJQuery = (_providerStr) => {
  // Replaces `const $ = ...` to `const $document = ...`
  let providerStr = _providerStr.replace(
    /const \$ = document\.querySelector\.bind\(document\)/g,
    'const $document = document.querySelector.bind(document)'
  )

  // Replaces usages of `$` to `$document`
  providerStr = providerStr.replace(
    /\$\('head > link\[rel~="icon"\]'\)\?\.href \|\| \$\('head > meta\[itemprop="image"\]'\)\?\.content/g,
    '$document(\'head > link[rel~="icon"]\')?.href || $document(\'head > meta[itemprop="image"]\')?.content'
  )
  providerStr = providerStr.replace(
    /document\.title \|\| \$\('head > meta\[name="title"\]'\)\?\.content \|\| origin/g,
    'document.title || $document(\'head > meta[name="title"]\')?.content || origin'
  )

  return providerStr
}

const useGetProviderInjection = () => {
  const [provider, setProvider] = useState('')

  useEffect(() => {
    isiOS
      ? RNFS.readFile(`${RNFS.MainBundlePath}/EthereumProvider.js`, 'utf8')
          .then((ethereumProviderScript) => {
            setProvider(`
            ${commonScript}
            ${temporaryBuild42fixForProviderOverridingJQuery(ethereumProviderScript)}

            true;
          `)
          })
          .catch((error) => {
            console.error(`Error reloading ${`${RNFS.MainBundlePath}/EthereumProvider.js`}:`, error)
          })
      : RNFS.readFileAssets('EthereumProvider.js', 'utf8')
          .then((ethereumProviderScript) => {
            setProvider(`
            ${commonScript}
            ${temporaryBuild42fixForProviderOverridingJQuery(ethereumProviderScript)}

            true;
          `)
          })
          .catch((error) => {
            console.error('Error reloading EthereumProvider.js:', error)
          })
  }, [])

  return {
    script: provider
  }
}

export default useGetProviderInjection
