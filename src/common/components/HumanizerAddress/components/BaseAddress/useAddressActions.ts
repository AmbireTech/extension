import { ZeroAddress } from 'ethers'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'

import { getCoinGeckoTokenUrl } from '@ambire-common/consts/coingecko'
import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import { setStringAsync } from '@common/utils/clipboard'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

/**
 * Returns the network of an address and handlers for copying it and opening it in the explorer.
 */
const useAddressActions = ({
  address,
  chainId,
  isToken
}: {
  address: string
  chainId?: bigint
  isToken?: boolean
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { benzinNetworks } = useBenzinNetworksContext()
  // Standalone Benzin doesn't have access to controllers
  const { state: networks } = useController('NetworksController', selectNetworks)

  const actualNetworks = networks ?? benzinNetworks
  const network = actualNetworks?.find((n) => n.chainId === chainId)

  const handleCopyAddress = useCallback(async () => {
    try {
      await setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'), {
        type: 'error'
      })
    }
  }, [addToast, address, t])

  const handleOpenExplorer = useCallback(async () => {
    if (!network) return

    try {
      const targetUrl =
        address === ZeroAddress
          ? // Exception for native tokens, they don't have a block explorer URLs
            getCoinGeckoTokenUrl(network.nativeAssetId)
          : `${network.explorerUrl}/${isToken ? 'token' : 'address'}/${address}`

      // use Linking instead of openInTab as openInTab may trigger
      // a close of the action window. We don't want to close it, we
      // want to minimize it on the side
      await Linking.openURL(targetUrl)
    } catch {
      addToast(t('Failed to open explorer'), {
        type: 'error'
      })
    }
  }, [addToast, address, network, isToken, t])

  return { network, handleCopyAddress, handleOpenExplorer }
}

export default useAddressActions
