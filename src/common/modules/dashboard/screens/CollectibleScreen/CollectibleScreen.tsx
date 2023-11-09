import ERC721Abi from 'ambire-common/src/constants/abis/ERC721Abi'
import networks from 'ambire-common/src/constants/networks'
import { getBip44Items, resolveENSDomain } from 'ambire-common/src/services/ensDomains'
import { getProvider } from 'ambire-common/src/services/provider'
import { resolveUDomain } from 'ambire-common/src/services/unstoppableDomains'
import { validateSendNftAddress } from 'ambire-common/src/services/validations'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Blockies from '@common/components/Blockies'
import Button from '@common/components/Button'
import FastImage from '@common/components/FastImage'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import NavIconWrapper from '@common/components/NavIconWrapper'
import Panel from '@common/components/Panel'
import Recipient from '@common/components/Recipient'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import CONFIG, { isiOS } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useAddressBook from '@common/hooks/useAddressBook'
import useConstants from '@common/hooks/useConstants'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import useRequests from '@common/hooks/useRequests'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'
import CollectibleLoader from '@common/modules/dashboard/components/Loaders/CollectibleLoader'
import handleCollectibleUri from '@common/modules/dashboard/helpers/handleCollectibleUri'
import { fetchGet } from '@common/services/fetch'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

const ERC721 = new Interface(ERC721Abi)

const CollectibleScreen = () => {
  const { t } = useTranslation()
  const { goBack } = useNavigation()
  const { isKnownAddress } = useAddressBook()
  const { addToast } = useToast()
  const { addRequest } = useRequests()
  const { network: selectedNetwork } = useNetwork()
  const { constants } = useConstants()
  const { params } = useRoute()
  const { tokenId, network, address: collectionAddr }: any = params
  const [isLoading, setLoading] = useState(true)
  const { selectedAcc } = useAccounts()
  const [isAssetImageLoading, setIsAssetImageLoading] = useState(true)
  const [metadata, setMetadata] = useState<any>({
    owner: {
      address: '',
      icon: ''
    },
    name: '',
    description: '',
    image: '',
    collection: '',
    explorerUrl: ''
  })
  const [recipientAddress, setRecipientAddress] = useState('')
  const [uDAddress, setUDAddress] = useState('')
  const [ensAddress, setEnsAddress] = useState('')
  const [isTransferDisabled, setTransferDisabled] = useState(true)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [validationFormMgs, setValidationFormMgs] = useState<any>({
    success: false,
    message: ''
  })

  const timer: any = useRef(null)

  const handleNavigateBack = () => {
    goBack()
  }

  const sendTransferTx = () => {
    const recipAddress = uDAddress || ensAddress || recipientAddress

    try {
      const req: any = {
        id: `transfer_nft_${Date.now()}`,
        type: 'eth_sendTransaction',
        dateAdded: new Date().valueOf(),
        chainId: selectedNetwork?.chainId,
        account: selectedAcc,
        txn: {
          to: collectionAddr,
          value: '0',
          data: ERC721.encodeFunctionData('transferFrom', [
            metadata.owner.address,
            recipAddress,
            tokenId
          ])
        },
        meta: null
      }

      if (uDAddress) {
        req.meta = {
          addressLabel: {
            addressLabel: recipientAddress,
            address: uDAddress
          }
        }
      } else if (ensAddress) {
        req.meta = {
          addressLabel: {
            addressLabel: recipientAddress,
            address: ensAddress
          }
        }
      }

      addRequest(req)
    } catch (e) {
      addToast(`Error: ${e.message || e}`, { error: true })
    }
  }

  useEffect(() => {
    if (recipientAddress.startsWith('0x') && recipientAddress.indexOf('.') === -1) {
      const isAddressValid = validateSendNftAddress(
        recipientAddress,
        selectedAcc,
        addressConfirmed,
        isKnownAddress,
        metadata,
        selectedNetwork,
        network,
        constants!.humanizerInfo
      )

      setTransferDisabled(!isAddressValid.success)
      setValidationFormMgs({
        success: isAddressValid.success,
        message: isAddressValid.message ? isAddressValid.message : ''
      })
    } else {
      if (timer.current) {
        clearTimeout(timer.current)
      }

      const validateForm = async () => {
        const uDAddr = await resolveUDomain(
          recipientAddress,
          null,
          selectedNetwork?.unstoppableDomainsChain
        )
        const bip44Item = getBip44Items(null)
        const ensAddr = await resolveENSDomain(recipientAddress, bip44Item)

        timer.current = null
        const isUDAddress = !!uDAddr
        const isEnsAddress = !!ensAddr
        let selectedAddress = ''
        if (isUDAddress) selectedAddress = uDAddr
        if (isEnsAddress) selectedAddress = ensAddr
        else selectedAddress = recipientAddress

        const isAddressValid = validateSendNftAddress(
          selectedAddress,
          selectedAcc,
          addressConfirmed,
          isKnownAddress,
          metadata,
          selectedNetwork,
          network,
          constants!.humanizerInfo,
          isUDAddress,
          isEnsAddress
        )
        setUDAddress(uDAddr)
        setEnsAddress(ensAddr)

        setTransferDisabled(!isAddressValid.success)
        setValidationFormMgs({
          success: isAddressValid.success,
          message: isAddressValid.message ? isAddressValid.message : ''
        })
      }

      timer.current = setTimeout(async () => validateForm().catch(console.error), 300)
    }

    return () => clearTimeout(timer.current)
  }, [
    recipientAddress,
    metadata,
    selectedNetwork,
    selectedAcc,
    network,
    addressConfirmed,
    isKnownAddress,
    constants
  ])

  const fetchMetadata = useCallback(async () => {
    setLoading(true)
    setMetadata({})

    try {
      const networkDetails = networks.find(({ id }) => id === network)
      if (!networkDetails) throw new Error('This network is not supported')

      const { explorerUrl } = networkDetails
      const provider = getProvider(networkDetails.id)
      const contract = new ethers.Contract(collectionAddr, ERC721Abi, provider)

      const [collection, address, maybeUri1, maybeUri2] = await Promise.all([
        contract.name(),
        contract.ownerOf(tokenId),
        contract
          .tokenURI(tokenId)
          .then((uri: any) => ({ uri }))
          .catch((err: any) => ({ err })),
        contract
          .uri(tokenId)
          .then((uri: any) => ({ uri }))
          .catch((err: any) => ({ err }))
      ])
      const uri = maybeUri1.uri || maybeUri2.uri
      if (!uri) throw maybeUri1.err || maybeUri2.err

      let json: any = {}

      if (uri.startsWith('data:application/json')) {
        json = JSON.parse(uri.replace('data:application/json;utf8,', ''))
      } else {
        const jsonUrl = handleCollectibleUri(uri)
        const response = await fetch(jsonUrl)
        json = await response.json()
      }

      const image = json ? handleCollectibleUri(json?.image) : null
      // eslint-disable-next-line @typescript-eslint/no-shadow
      setMetadata((metadata: any) => ({
        ...metadata,
        ...json,
        image
      }))

      // eslint-disable-next-line @typescript-eslint/no-shadow
      setMetadata((metadata: any) => ({
        ...metadata,
        collection,
        owner: {
          address
        },
        explorerUrl
      }))

      setLoading(false)
    } catch (e) {
      try {
        const { success, collection, description, image, name, owner, message } = await fetchGet(
          `${CONFIG.VELCRO_API_ENDPOINT}/nftmeta/${collectionAddr}/${tokenId}?network=${network}`
        )
        if (!success) throw new Error(message)

        const networkDetails = networks.find(({ id }) => id === network)
        if (!networkDetails) throw new Error('This network is not supported')

        const { explorerUrl } = networkDetails
        // eslint-disable-next-line @typescript-eslint/no-shadow
        setMetadata((metadata: any) => ({
          ...metadata,
          collection,
          description,
          image,
          name,
          owner: {
            address: owner
          },
          explorerUrl
        }))

        setLoading(false)
        // eslint-disable-next-line @typescript-eslint/no-shadow
      } catch (e) {
        addToast(`Collectible error: ${e.message || e}`, { error: true })
      }
    }
  }, [addToast, tokenId, collectionAddr, network])

  useEffect(() => {
    fetchMetadata()
  }, [fetchMetadata])

  const collectibleContent = (
    <>
      <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
        <NavIconWrapper onPress={handleNavigateBack} style={spacings.mrSm}>
          <LeftArrowIcon />
        </NavIconWrapper>
        <View style={flexboxStyles.flex1}>
          <Text weight="regular" numberOfLines={1} fontSize={14}>
            {metadata.collection || t('Unknown')}
          </Text>
          <Text weight="regular" numberOfLines={1} fontSize={14}>
            #{tokenId}
          </Text>
        </View>
      </View>
      <View style={styles.contractAddressWrapper}>
        <Text fontSize={10} color={colors.chetwode}>
          {t('Contract address:')}
        </Text>
        <Text fontSize={10} color={colors.chetwode} ellipsizeMode="middle" numberOfLines={1}>
          {collectionAddr}
        </Text>
      </View>
      <View style={[flexboxStyles.directionRow, spacings.mbTy]}>
        <View style={[flexboxStyles.flex1, spacings.prTy]}>
          {!!isAssetImageLoading && (
            <View style={styles.collectibleImageLoadingWrapper}>
              <Spinner />
            </View>
          )}
          <FastImage
            style={styles.collectibleImage}
            source={{ uri: handleCollectibleUri(metadata.image) }}
            onLoad={() => setIsAssetImageLoading(false)}
            onError={() => setIsAssetImageLoading(false)}
          />
        </View>
        <View style={[flexboxStyles.flex1]}>
          <Text numberOfLines={2} weight="regular" fontSize={14} style={spacings.mbTy}>
            {metadata.name}
          </Text>
          <Text numberOfLines={7} weight="regular" fontSize={10}>
            {metadata.description}
          </Text>
        </View>
      </View>
      <View>
        <Text fontSize={12} style={spacings.mbMi}>
          {t('Owner: ')}
        </Text>
        <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
          <View style={spacings.mrMi}>
            <Blockies borderRadius={50} size={8} scale={2} seed={metadata?.owner?.address} />
          </View>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() =>
              Linking.openURL(`${metadata?.explorerUrl}/address/${metadata?.owner?.address}`)
            }
          >
            {metadata?.owner?.address === selectedAcc ? (
              <Text>
                <Text fontSize={10}>{'You '}</Text>
                <Text fontSize={10} numberOfLines={1}>{`(${metadata?.owner?.address})`}</Text>
              </Text>
            ) : (
              <Text fontSize={10}>{metadata?.owner?.address}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  )

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        keyboardDismissMode="on-drag"
        type={isiOS ? WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW : WRAPPER_TYPES.SCROLL_VIEW}
        extraHeight={250}
        hasBottomTabNav
      >
        <Panel type="filled">
          {!!isLoading && <CollectibleLoader onPress={handleNavigateBack} />}
          {!isLoading && collectibleContent}
        </Panel>

        <View>
          <Text fontSize={16} weight="medium" style={spacings.mbTy}>
            {t('Transfer to:')}
          </Text>
          <Recipient
            setAddress={setRecipientAddress}
            address={recipientAddress}
            uDAddress={uDAddress}
            ensAddress={ensAddress}
            addressValidationMsg={validationFormMgs.message}
            setAddressConfirmed={setAddressConfirmed}
            addressConfirmed={addressConfirmed}
          />
          <View style={[spacings.mbMd]}>
            <Button
              text={t('Send')}
              disabled={isLoading || isTransferDisabled}
              onPress={sendTransferTx}
            />
          </View>
        </View>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default React.memo(CollectibleScreen)
