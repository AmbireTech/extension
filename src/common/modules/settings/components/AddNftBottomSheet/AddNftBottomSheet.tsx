import { getAddress } from 'ethers'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { getAssetPreferenceId } from '@ambire-common/libs/portfolio/customToken'
import { getAssetCacheKey, getCollectibleCacheKey } from '@ambire-common/libs/portfolio/helpers'
import {
  AssetValidationReason,
  TokenValidationResult
} from '@ambire-common/libs/portfolio/interfaces'
import { isValidAddress } from '@ambire-common/services/address'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Alert from '@common/components/Alert/Alert'
import CollectionCard from '@common/components/CollectionCard'
import Input from '@common/components/Input'
import { NetworkIconIdType } from '@common/components/NetworkIcon/NetworkIcon'
import Spinner from '@common/components/Spinner'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import AddAssetBottomSheet from '@common/modules/settings/components/AddAssetBottomSheet'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  sheetRef: React.RefObject<any>
  handleClose: () => void
}

const CHECK_TIMEOUT_MS = 15000

/** The library reports why an asset was rejected, the wording belongs here */
const getRejectionMessage = (
  reason: AssetValidationReason | null | undefined,
  t: (message: string) => string
) => {
  switch (reason) {
    case 'erc1155-unsupported':
      return t('This type of NFT (ERC-1155) is not supported yet')
    case 'is-a-token':
      return t('This is a token, not an NFT collection')
    case 'collectible-not-found':
      return t("This NFT doesn't exist in this collection")
    case 'collectible-not-owned':
      return t("You don't own this NFT")
    case 'network-problem':
      return t('There was a network problem while checking this NFT. Please try again.')
    // A rejection always comes with a reason, but never leave the user without
    // an explanation
    default:
      return t("This address doesn't look like an NFT collection")
  }
}

const AddNftBottomSheet: FC<Props> = ({ sheetRef, handleClose }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks, isInitialized } = useController('NetworksController').state
  const { addToast } = useToast()
  const {
    state: { validTokens, customTokens, tokenPreferences },
    dispatch: portfolioDispatch
  } = useController('PortfolioController')
  const {
    state: { portfolio: selectedAccountPortfolio, account }
  } = useController('SelectedAccountController')
  // Derived, so the sheet recovers if it opens before the networks are loaded
  const [selectedChainId, setSelectedChainId] = useState<bigint | undefined>()
  const network = useMemo(() => {
    if (!isInitialized) return undefined

    return (
      networks.find(({ chainId }) => chainId === selectedChainId) ??
      networks.find(({ chainId }) => chainId === 1n) ??
      networks[0]
    )
  }, [isInitialized, networks, selectedChainId])
  const [hasCheckTimedOut, setHasCheckTimedOut] = useState(false)
  // Bumped to re-run the check after it timed out, as the address hasn't changed
  const [checkAttempt, setCheckAttempt] = useState(0)

  const { control, watch, reset } = useForm({
    mode: 'all',
    defaultValues: { address: '', tokenId: '' }
  })
  // Pasted addresses often carry whitespace, which fails the validation
  const address = watch('address', '').trim()
  const isAddressValid = isValidAddress(address)
  // A collectible is added on its own, so its id is required
  const tokenId = watch('tokenId', '').trim()
  const isTokenIdValid = /^\d+$/.test(tokenId)

  const validation = useMemo(() => {
    if (!isAddressValid || !network) return undefined

    return validTokens?.erc721?.[getAssetCacheKey(address, network.chainId)]
  }, [address, isAddressValid, network, validTokens])
  const collectionMeta: TokenValidationResult['collection'] | undefined = validation?.collection
  const hasVerdict = typeof validation?.isValid === 'boolean'

  const { isAlreadyAdded, isHidden } = useMemo(() => {
    const nothingFound = { isAlreadyAdded: false, isHidden: false }
    if (!isAddressValid || !network) return nothingFound

    const collection = selectedAccountPortfolio.collections.find(
      (portfolioAsset) =>
        getAssetCacheKey(portfolioAsset.address, portfolioAsset.chainId) ===
        getAssetCacheKey(address, network.chainId)
    )

    if (!isTokenIdValid) return nothingFound

    const collectibleId = getAssetPreferenceId({
      address,
      chainId: network.chainId,
      tokenId: BigInt(tokenId)
    })
    const isCustom = customTokens.some(
      (customToken) => getAssetPreferenceId(customToken) === collectibleId
    )
    const isCollectibleHidden = tokenPreferences.some(
      (preference) => preference.isHidden && getAssetPreferenceId(preference) === collectibleId
    )
    const isInPortfolio = !!collection?.collectibles.includes(BigInt(tokenId))

    return {
      isAlreadyAdded: !isCollectibleHidden && (isCustom || isInPortfolio),
      isHidden: isCollectibleHidden
    }
  }, [
    address,
    customTokens,
    isAddressValid,
    isTokenIdValid,
    network,
    selectedAccountPortfolio.collections,
    tokenId,
    tokenPreferences
  ])

  const handleNetworkChange = useCallback(
    (selectedNetwork: Network) => setSelectedChainId(selectedNetwork.chainId),
    []
  )

  const handleCloseAndReset = useCallback(() => {
    handleClose()
    reset({ address: '', tokenId: '' })
  }, [handleClose, reset])

  const handleAddNft = useCallback(() => {
    if (!isAddressValid || !isTokenIdValid || !network || !account) return

    // The portfolio works with checksummed addresses
    let checksummedAddress
    try {
      checksummedAddress = getAddress(address)
    } catch (e) {
      // The address passed `isValidAddress`, so a failure here is a disagreement
      // between the two checks rather than bad input
      console.error('Error while normalizing the NFT collection address', e)
      addToast(t('This address is not valid. Please check it and try again.'), { type: 'error' })

      return
    }

    // The collectible is requested as a hint, so the portfolio can verify the
    // ownership and display it
    portfolioDispatch({
      type: 'method',
      params: {
        method: 'addErc721sToBeLearned',
        args: [[[checksummedAddress, [BigInt(tokenId)]]], account.addr, network.chainId]
      }
    })

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'addCustomToken',
        args: [
          {
            address: checksummedAddress,
            standard: 'ERC721',
            chainId: network.chainId,
            tokenId: BigInt(tokenId)
          },
          account.addr,
          true
        ]
      }
    })
    addToast(t('Added the NFT to your portfolio'))
    handleCloseAndReset()
  }, [
    account,
    addToast,
    address,
    handleCloseAndReset,
    isAddressValid,
    isTokenIdValid,
    network,
    portfolioDispatch,
    t,
    tokenId
  ])

  const ownership = useMemo(() => {
    if (!isTokenIdValid || !isAddressValid || !network) return undefined

    return validTokens?.erc721?.[getCollectibleCacheKey(address, network.chainId, BigInt(tokenId))]
  }, [address, isAddressValid, isTokenIdValid, network, tokenId, validTokens])
  const hasOwnershipVerdict = typeof ownership?.isValid === 'boolean'

  // A network problem says nothing about the NFT, so it is worth asking again
  const isCollectionCheckRetryable = validation?.error?.type === 'network'
  const isOwnershipCheckRetryable = ownership?.error?.type === 'network'

  // Both checks share one lifecycle, so a single timeout and a single retry
  // cover them
  useEffect(() => {
    setHasCheckTimedOut(false)

    if (!isAddressValid || !network || !account || isAlreadyAdded) return

    const shouldCheckCollection = !hasVerdict || isCollectionCheckRetryable
    const shouldCheckOwnership =
      isTokenIdValid && (!hasOwnershipVerdict || isOwnershipCheckRetryable)

    if (!shouldCheckCollection && !shouldCheckOwnership) return

    if (shouldCheckCollection) {
      portfolioDispatch({
        type: 'method',
        params: {
          method: 'updateCollectionValidation',
          // The last argument asks the controller to look past a stored verdict
          args: [{ address, chainId: network.chainId }, account.addr, isCollectionCheckRetryable]
        }
      })
    }

    if (shouldCheckOwnership) {
      portfolioDispatch({
        type: 'method',
        params: {
          method: 'updateCollectibleValidation',
          args: [
            { address, chainId: network.chainId, tokenId: BigInt(tokenId) },
            account.addr,
            isOwnershipCheckRetryable
          ]
        }
      })
    }

    // The dispatch is fire-and-forget, so the spinner needs a way out
    const timeout = setTimeout(() => setHasCheckTimedOut(true), CHECK_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [
    account,
    address,
    checkAttempt,
    hasOwnershipVerdict,
    hasVerdict,
    isAddressValid,
    isAlreadyAdded,
    isCollectionCheckRetryable,
    isOwnershipCheckRetryable,
    isTokenIdValid,
    network,
    portfolioDispatch,
    tokenId
  ])

  const retryCheck = useCallback(() => setCheckAttempt((attempt) => attempt + 1), [])

  // Either check can be the one still missing, so the spinner and the timeout
  // that replaces it both wait on the same condition
  const isMissingVerdict =
    isAddressValid && !isAlreadyAdded && (!hasVerdict || (isTokenIdValid && !hasOwnershipVerdict))
  const isValidating = isMissingVerdict && !hasCheckTimedOut

  return (
    <AddAssetBottomSheet
      id="add-custom-nft"
      sheetRef={sheetRef}
      handleClose={handleCloseAndReset}
      title={t('Add NFT')}
      headerTestID="add-nft-modal-title-text"
      addressLabel={t('NFT collection address')}
      addressFieldTestID="nft-address-field"
      addressError={address && !isAddressValid ? t('Invalid address') : undefined}
      network={network}
      onNetworkChange={handleNetworkChange}
      submitText={t('Add NFT')}
      submitTestID="add-nft-button"
      isSubmitDisabled={
        !isAddressValid ||
        !isTokenIdValid ||
        isAlreadyAdded ||
        isHidden ||
        isValidating ||
        !validation?.isValid ||
        !ownership?.isValid
      }
      onSubmit={handleAddNft}
      control={control}
      extraFields={
        <Controller
          control={control}
          name="tokenId"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              testID="nft-token-id-field"
              onBlur={onBlur}
              onChangeText={onChange}
              label={t('NFT ID')}
              placeholder={t('e.g. 3142')}
              value={value}
              containerStyle={spacings.mbSm}
              error={
                (value && !isTokenIdValid && t('The NFT ID is a number')) ||
                // An NFT that is already added or hidden has its own alert, and
                // a stored ownership verdict would contradict it
                (hasOwnershipVerdict &&
                !ownership?.isValid &&
                !isOwnershipCheckRetryable &&
                !isAlreadyAdded &&
                !isHidden
                  ? getRejectionMessage(ownership?.error?.reason, t)
                  : undefined) ||
                undefined
              }
              backgroundColor={theme.secondaryBackground}
            />
          )}
        />
      }
    >
      {/* The NFT, the same way the dashboard displays it */}
      {validation?.isValid && ownership?.isValid && network && !isAlreadyAdded && !isHidden ? (
        <CollectionCard
          name={collectionMeta?.name || shortenAddress(address, 13)}
          address={address}
          chainId={network.chainId.toString() as NetworkIconIdType}
          collectibles={[BigInt(tokenId)]}
          priceIn={[]}
          networks={networks}
        />
      ) : null}

      {isAlreadyAdded ? (
        <Alert
          type="warning"
          isTypeLabelHidden
          title={t('This NFT is already in your wallet')}
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}

      {isHidden ? (
        <Alert
          type="warning"
          isTypeLabelHidden
          title={t('This NFT is hidden. Unhide it from the NFTs tab to see it again.')}
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}

      {!isAlreadyAdded && hasVerdict && !validation?.isValid ? (
        <Alert
          type={isCollectionCheckRetryable ? 'warning' : 'error'}
          isTypeLabelHidden
          title={getRejectionMessage(validation?.error?.reason, t)}
          buttonProps={
            isCollectionCheckRetryable ? { text: t('Try again'), onPress: retryCheck } : undefined
          }
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}

      {!isAlreadyAdded && validation?.isValid && isOwnershipCheckRetryable ? (
        <Alert
          type="warning"
          isTypeLabelHidden
          title={getRejectionMessage('network-problem', t)}
          buttonProps={{ text: t('Try again'), onPress: retryCheck }}
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}

      {isValidating ? (
        <View style={[flexbox.alignCenter, flexbox.justifyCenter, { height: 48 }]}>
          <Spinner style={{ width: 18, height: 18 }} />
        </View>
      ) : null}

      {isMissingVerdict && hasCheckTimedOut ? (
        <Alert
          type="warning"
          isTypeLabelHidden
          title={t("Couldn't check this NFT. Please make sure you're online.")}
          buttonProps={{ text: t('Try again'), onPress: retryCheck }}
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}
    </AddAssetBottomSheet>
  )
}

export default React.memo(AddNftBottomSheet)
