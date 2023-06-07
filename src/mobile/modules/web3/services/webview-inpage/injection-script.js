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

const useGetProviderInjection = () => {
  const [provider, setProvider] = useState('')

  useEffect(() => {
    isiOS
      ? RNFS.readFile(`${RNFS.MainBundlePath}/EthereumProvider.js`, 'utf8')
          .then((ethereumProviderScript) => {
            setProvider(`
            ${commonScript}
            ${ethereumProviderScript}

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
            ${ethereumProviderScript}

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
