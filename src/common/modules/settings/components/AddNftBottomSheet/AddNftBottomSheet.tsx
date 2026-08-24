import { getAddress } from 'ethers'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { getAssetPreferenceId } from '@ambire-common/libs/portfolio/customToken'
import { getAssetCacheKey } from '@ambire-common/libs/portfolio/helpers'
import { TokenValidationResult } from '@ambire-common/libs/portfolio/interfaces'
import { isValidAddress } from '@ambire-common/services/address'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Alert from '@common/components/Alert/Alert'
import Badge from '@common/components/Badge'
import CollectionThumbnail from '@common/components/CollectionThumbnail'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Input from '@common/components/Input'
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
  const [network, setNetwork] = useState<Network | undefined>(
    isInitialized ? (networks.find((n) => n.chainId === 1n) ?? networks[0]) : undefined
  )
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

  useEffect(() => {
    setHasCheckTimedOut(false)

    if (!isAddressValid || !network || !account || isAlreadyAdded) return
    if (hasVerdict) return

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'updateCollectionValidation',
        args: [{ address, chainId: network.chainId }, account.addr]
      }
    })

    // The dispatch is fire-and-forget, so the spinner needs a way out
    const timeout = setTimeout(() => setHasCheckTimedOut(true), CHECK_TIMEOUT_MS)

    return () => clearTimeout(timeout)
  }, [
    account,
    address,
    checkAttempt,
    hasVerdict,
    isAddressValid,
    isAlreadyAdded,
    network,
    portfolioDispatch
  ])

  const retryCheck = useCallback(() => setCheckAttempt((attempt) => attempt + 1), [])

  const ownership = useMemo(() => {
    if (!isTokenIdValid || !isAddressValid || !network) return undefined

    return validTokens?.erc721?.[`${getAssetCacheKey(address, network.chainId)}-${tokenId}`]
  }, [address, isAddressValid, isTokenIdValid, network, tokenId, validTokens])
  const hasOwnershipVerdict = typeof ownership?.isValid === 'boolean'

  useEffect(() => {
    if (!isTokenIdValid || !isAddressValid || !network || !account) return
    if (hasOwnershipVerdict) return

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'updateCollectibleValidation',
        args: [{ address, chainId: network.chainId, tokenId: BigInt(tokenId) }, account.addr]
      }
    })
  }, [
    account,
    address,
    hasOwnershipVerdict,
    isAddressValid,
    isTokenIdValid,
    network,
    portfolioDispatch,
    tokenId
  ])

  // No verdict yet means the check is still running
  const isValidating = isAddressValid && !isAlreadyAdded && !hasVerdict && !hasCheckTimedOut

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
      onNetworkChange={setNetwork}
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
              label={t('Item ID')}
              placeholder={t('e.g. 3142')}
              value={value}
              containerStyle={spacings.mbSm}
              error={
                (value && !isTokenIdValid && t('The item ID is a number')) ||
                (hasOwnershipVerdict && !ownership?.isValid && ownership?.error?.message) ||
                undefined
              }
              backgroundColor={theme.secondaryBackground}
            />
          )}
        />
      }
    >
      {validation?.isValid && !isAlreadyAdded && !isHidden ? (
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.phTy, spacings.pvTy]}>
          <CollectionThumbnail
            address={address}
            chainId={network?.chainId ?? 0n}
            collectibleId={isTokenIdValid ? BigInt(tokenId) : undefined}
            networks={networks}
          />
          <Text
            testID="custom-nft-name"
            fontSize={16}
            style={spacings.mlTy}
            weight="semiBold"
            numberOfLines={1}
          >
            {collectionMeta?.name || shortenAddress(address, 13)}
            {isTokenIdValid ? ` #${tokenId}` : ''}
          </Text>
          <Badge text={t('NFT')} />
        </View>
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
          type={validation?.error?.type === 'network' ? 'warning' : 'error'}
          isTypeLabelHidden
          // A rejection always comes with a reason, but never leave the user
          // without an explanation
          title={
            validation?.error?.message || t("This address doesn't look like an NFT collection")
          }
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}

      {isValidating ? (
        <View style={[flexbox.alignCenter, flexbox.justifyCenter, { height: 48 }]}>
          <Spinner style={{ width: 18, height: 18 }} />
        </View>
      ) : null}

      {isAddressValid && !isAlreadyAdded && !hasVerdict && hasCheckTimedOut ? (
        <Alert
          type="warning"
          isTypeLabelHidden
          title={t("Couldn't check this NFT collection. Please make sure you're online.")}
          buttonProps={{ text: t('Try again'), onPress: retryCheck }}
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}
    </AddAssetBottomSheet>
  )
}

export default React.memo(AddNftBottomSheet)
