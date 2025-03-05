import { Contract, JsonRpcProvider } from 'ethers'
import React, { FC, memo, useEffect, useMemo, useState } from 'react'

import { NetworkId } from '@ambire-common/interfaces/network'
import { CollectionResult, TokenResult } from '@ambire-common/libs/portfolio'
import { resolveAssetInfo } from '@ambire-common/services/assetInfo'
import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import SkeletonLoader from '@common/components/SkeletonLoader'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import { SPACING_TY } from '@common/styles/spacings'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import HumanizerAddress from '../HumanizerAddress'
import Nft from './components/Nft'
import Token from './components/Token'

interface Props {
  address: string
  value: bigint
  sizeMultiplierSize?: number
  textSize?: number
  networkId?: NetworkId
  chainId?: bigint
}

const TokenOrNft: FC<Props> = ({
  value,
  address,
  textSize = 16,
  networkId,
  chainId,
  sizeMultiplierSize = 1
}) => {
  const marginRight = SPACING_TY * sizeMultiplierSize
  const { addToast } = useToast()
  const [assetInfo, setAssetInfo] = useState<{
    tokenInfo?: TokenResult
    nftInfo?: CollectionResult
  }>({})
  const { portfolio } = useSelectedAccountControllerState()

  const { t } = useTranslation()
  const { networks: controllerNetworks } = useNetworksControllerState()
  const { benzinNetworks, addNetwork } = useBenzinNetworksContext()
  // Component used across Benzin and Extension, make sure to always set networks
  const networks = controllerNetworks ?? benzinNetworks
  const network = useMemo(
    () => networks.find((n) => (chainId ? n.chainId === chainId : n.id === networkId)) || null,
    [networks, chainId, networkId]
  )

  const [fallbackName, setFallbackName] = useState()
  useEffect(() => {
    if (!network) return
    const provider = new JsonRpcProvider(network.selectedRpcUrl || network.rpcUrls[0])
    const contract = new Contract(address, ['function name() view returns(string)'], provider)
    contract.name().then(setFallbackName).catch(console.error)
  }, [network, address])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 3000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (addNetwork && chainId && !network) {
      addNetwork(chainId)
      return
    }
    const tokenFromPortfolio = portfolio?.tokens?.find(
      (token) =>
        token.address.toLowerCase() === address.toLowerCase() && token.networkId === network?.id
    )
    const nftFromPortfolio = portfolio?.collections?.find(
      (c) => c.address.toLowerCase() === address.toLowerCase() && c.networkId === network?.id
    )
    if (tokenFromPortfolio || nftFromPortfolio)
      setAssetInfo({ tokenInfo: tokenFromPortfolio, nftInfo: nftFromPortfolio })
    else if (network)
      resolveAssetInfo(address, network, (_assetInfo: any) => {
        setAssetInfo(_assetInfo)
      }).catch((e) => {
        console.error(e)
        addToast(t('We were unable to fetch token info'), { type: 'error' })
      })
  }, [
    address,
    network,
    addToast,
    portfolio?.collections,
    portfolio?.tokens,
    t,
    addNetwork,
    chainId
  ])

  if (!assetInfo.nftInfo && !assetInfo.tokenInfo)
    if (isLoading) return <SkeletonLoader width={140} height={24} appearance="tertiaryBackground" />
    // @NOTE: temporary solution as a fallback mechanism for ERC-1155 tokens which we do not support currently
    else if (fallbackName)
      return (
        <HumanizerAddress
          address={address}
          highestPriorityAlias={`${fallbackName} #${value}`}
          marginRight={marginRight}
          fontSize={textSize}
        />
      )
    else
      return (
        <Token
          textSize={textSize}
          network={network ?? undefined}
          address={address}
          amount={value}
          tokenInfo={assetInfo?.tokenInfo}
          marginRight={marginRight}
        />
      )

  if (network && assetInfo.nftInfo && !assetInfo.tokenInfo)
    return (
      <Nft
        address={address}
        network={network}
        networks={networks}
        tokenId={value}
        nftInfo={assetInfo.nftInfo}
        hideSendNft
      />
    )

  return (
    <Token
      textSize={textSize}
      network={network ?? undefined}
      address={address}
      amount={value}
      tokenInfo={assetInfo?.tokenInfo}
      marginRight={marginRight}
    />
  )
}

export default memo(TokenOrNft)
