import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Image, ImageSourcePropType, Pressable, View, ViewStyle } from 'react-native'

import { NetworkFeature } from '@ambire-common/interfaces/network'
import { isColibriProviderAvailable } from '@ambire-common/libs/networks/colibri'
import {
  getFeatures,
  getLoadingFeatures,
  isNetworkInfoPending
} from '@ambire-common/libs/networks/networks'
import { getRpcProvider } from '@ambire-common/services/provider'
import { isValidURL } from '@ambire-common/services/validations'
import colibriLogo from '@common/assets/images/colibri-logo.png'
import CopyIcon from '@common/assets/svg/CopyIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Input from '@common/components/Input'
import NetworkAvailableFeatures from '@common/components/NetworkAvailableFeatures'
import NetworkIcon from '@common/components/NetworkIcon'
import NumberInput from '@common/components/NumberInput'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import {
  getAreDefaultsChanged,
  getEmptyRequiredNetworkFields,
  handleErrors
} from '@common/modules/settings/components/Networks/NetworkForm/helpers'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { setStringAsync } from '@common/utils/clipboard'

import getStyles from './styles'

type RpcSelectorItemType = {
  index: number
  url: string
  rpcUrlsLength: number
  forceLargeItems?: boolean
  selectedRpcUrl?: string
  shouldShowRemove: boolean
  style?: ViewStyle
  onPress: (url: string) => void
  onRemove?: (url: string) => void
  removeDisabledReason?: string
}

export const RpcSelectorItem = React.memo(
  ({
    index,
    url,
    rpcUrlsLength,
    forceLargeItems,
    selectedRpcUrl,
    shouldShowRemove,
    style,
    onPress,
    onRemove,
    removeDisabledReason
  }: RpcSelectorItemType) => {
    const { t } = useTranslation()
    const { addToast } = useToast()
    const { styles, theme } = useTheme(getStyles)
    const [hovered, setHovered] = useState(false)
    const [isRemoveHovered, setRemoveHovered] = useState(false)
    const [bindCopyIconAnim, copyIconAnimStyle] = useHover({
      preset: 'opacity'
    })

    const handleCopy = useCallback(async () => {
      try {
        await setStringAsync(url)
        addToast(t('Copied to clipboard!'), { timeout: 2500 })
      } catch (e) {
        addToast(t('Failed to copy to clipboard'), { type: 'error' })
        console.log('Copy failed', e)
      }
    }, [addToast, t, url])

    return (
      <Pressable
        style={[
          styles.selectRpcItem,
          index !== rpcUrlsLength - 1 && styles.selectRpcItemBorder,
          (rpcUrlsLength <= 2 || forceLargeItems) && { height: 40 },
          style,
          hovered && { backgroundColor: theme.secondaryBackground }
        ]}
        onPress={() => {
          if (url !== selectedRpcUrl) onPress(url)
        }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
      >
        <View style={[styles.radio]}>
          {(selectedRpcUrl === url || (hovered && !isRemoveHovered)) && (
            <View style={styles.radioSelectedInner} />
          )}
        </View>
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
          <Text
            fontSize={14}
            appearance={selectedRpcUrl === url ? 'primaryText' : 'secondaryText'}
            numberOfLines={1}
            style={flexbox.flex1}
          >
            {url}
          </Text>
          {isWeb && (
            <AnimatedPressable
              onPress={handleCopy}
              style={[spacings.mlMi, copyIconAnimStyle]}
              {...bindCopyIconAnim}
              onHoverIn={() => {
                // Persist hover of the parent to prevent
                // layout shifting
                setHovered(true)
              }}
            >
              <CopyIcon width={16} height={16} />
            </AnimatedPressable>
          )}
        </View>
        {!!shouldShowRemove && (!!hovered || isRemoveHovered) && (
          <Pressable
            style={{
              ...spacings.mlLg,
              opacity: removeDisabledReason ? 0.5 : 1
            }}
            onPress={() => !!onRemove && onRemove(url)}
            onHoverIn={() => {
              setRemoveHovered(true)
            }}
            onHoverOut={() => {
              setRemoveHovered(false)
            }}
            dataSet={
              removeDisabledReason
                ? createGlobalTooltipDataSet({
                    id: 'rpc-remove-disabled-reason',
                    content: removeDisabledReason
                  })
                : undefined
            }
            disabled={!!removeDisabledReason}
          >
            {({ hovered: removeButtonHovered }: any) => (
              <Text
                fontSize={12}
                underline
                color={removeButtonHovered ? theme.errorText : theme.errorDecorative}
              >
                {t('Remove')}
              </Text>
            )}
          </Pressable>
        )}
      </Pressable>
    )
  }
)

RpcSelectorItem.displayName = 'RpcSelector'

// On mobile the RPC URLs list expands/collapses instead of scrolling
const COLLAPSED_RPC_URLS_COUNT = 4

// While the form is checking an RPC URL itself there is no controller info to render yet,
// and `initial` would show the "?" rows instead of spinners.
const RPC_CHECK_IN_PROGRESS_FEATURES: NetworkFeature[] = getLoadingFeatures()

/**
 * Reads the chain id the RPC endpoint reports. Throws when the endpoint is unreachable
 * or is not a JSON-RPC node.
 */
const getRpcChainId = async (rpcUrl: string, expectedChainId?: string | number) => {
  // no need to call the global provider from ambire-common
  const rpc = getRpcProvider([rpcUrl], expectedChainId ? Number(expectedChainId) : undefined)

  try {
    const network = await rpc.getNetwork()
    return network.chainId
  } finally {
    rpc.destroy()
  }
}

const NetworkForm = ({
  selectedChainId = 'add-custom-network',
  onCancel,
  onSaved
}: {
  selectedChainId?: bigint | string
  onCancel: () => void
  onSaved: () => void
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    state: { allNetworks, networkToAddOrUpdate, statuses },
    dispatch: networksDispatch
  } = useController('NetworksController')
  // Which kind of RPC check is running, if any. A 'change' run is about to replace the
  // rendered network info, an 'add' run only validates a URL and leaves it alone.
  const [pendingRpcCheckType, setPendingRpcCheckType] = useState<'add' | 'change' | null>(null)
  // The RPC URL/chain id the controller was last asked about, so the form can tell whether
  // the info it reports belongs to that request or still to the previous one.
  const [requestedNetworkInfo, setRequestedNetworkInfo] = useState<{
    rpcUrl: string
    chainId: string
  } | null>(null)
  // Identifies the newest RPC check. An older one finishing later must not clear the
  // loading state the newest one is still waiting on.
  const rpcCheckRunIdRef = useRef(0)
  // The chain id the form filled in itself, so the `watch` subscription can tell it apart
  // from one the user typed and skip a redundant second check.
  const autoFilledChainIdRef = useRef<string | undefined>(undefined)
  const { styles, theme } = useTheme(getStyles)
  const colibriTooltipId = useId()

  const selectedNetwork = useMemo(
    () => allNetworks.find((network) => network.chainId.toString() === selectedChainId.toString()),
    [allNetworks, selectedChainId]
  )

  const {
    watch,
    setError,
    clearErrors,
    control,
    handleSubmit,
    setValue,
    formState: { errors, touchedFields }
  } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      rpcUrl: '',
      chainId: '',
      nativeAssetSymbol: '',
      nativeAssetName: '',
      explorerUrl: '',
      coingeckoPlatformId: '',
      coingeckoNativeAssetId: '',
      customBundlerUrl: '',
      isColibriEnabled: false
    },
    values: {
      name: selectedNetwork?.name || '',
      rpcUrl: '',
      chainId: Number(selectedNetwork?.chainId) || '',
      nativeAssetSymbol: selectedNetwork?.nativeAssetSymbol || '',
      nativeAssetName: selectedNetwork?.nativeAssetName || '',
      explorerUrl: selectedNetwork?.explorerUrl || '',
      coingeckoPlatformId: (selectedNetwork?.platformId as string) || '',
      coingeckoNativeAssetId: (selectedNetwork?.nativeAssetId as string) || '',
      customBundlerUrl: (selectedNetwork?.customBundlerUrl as string) || '',
      isColibriEnabled: !!selectedNetwork?.isColibriEnabled
    }
  })
  const [rpcUrls, setRpcUrls] = useState(selectedNetwork?.rpcUrls || [])
  const [selectedRpcUrl, setSelectedRpcUrl] = useState(selectedNetwork?.selectedRpcUrl)
  const [showAllRpcUrls, setShowAllRpcUrls] = useState(false)
  const networkFormValues = watch()
  const errorCount = Object.keys(errors).length

  const isSomethingUpdated = useMemo(() => {
    if (selectedRpcUrl !== selectedNetwork?.selectedRpcUrl) return true
    return getAreDefaultsChanged({ ...networkFormValues, rpcUrls }, selectedNetwork)
  }, [networkFormValues, rpcUrls, selectedNetwork, selectedRpcUrl])

  // True until the controller echoes back the request we made. Until then the info it
  // reports still belongs to the previous RPC URL.
  const isAwaitingNetworkInfo = useMemo(() => {
    if (!requestedNetworkInfo) return false

    return (
      networkToAddOrUpdate?.rpcUrl !== requestedNetworkInfo.rpcUrl ||
      networkToAddOrUpdate?.chainId.toString() !== requestedNetworkInfo.chainId
    )
  }, [networkToAddOrUpdate?.chainId, networkToAddOrUpdate?.rpcUrl, requestedNetworkInfo])

  const features = useMemo(() => {
    if (pendingRpcCheckType === 'change' || isAwaitingNetworkInfo)
      return RPC_CHECK_IN_PROGRESS_FEATURES

    return networkToAddOrUpdate?.info
      ? getFeatures(networkToAddOrUpdate?.info, selectedNetwork)
      : errors.chainId
        ? getFeatures(undefined, selectedNetwork)
        : selectedNetwork?.features || getFeatures(undefined, selectedNetwork)
  }, [
    errors.chainId,
    isAwaitingNetworkInfo,
    pendingRpcCheckType,
    networkToAddOrUpdate?.info,
    selectedNetwork
  ])
  const isColibriAvailable = useMemo(() => {
    try {
      return (
        !!networkFormValues.chainId && isColibriProviderAvailable(BigInt(networkFormValues.chainId))
      )
    } catch {
      return false
    }
  }, [networkFormValues.chainId])
  const shouldShowColibriSettings = isColibriAvailable
  const colibriTooltipContent = t(
    'Colibri verification will be available soon on mobile and is currently available in the extension only.'
  )
  const colibriTooltipDataSet = useMemo(
    () =>
      createGlobalTooltipDataSet({
        id: `colibri-mobile-disabled-${colibriTooltipId}`,
        content: colibriTooltipContent
      }),
    [colibriTooltipContent, colibriTooltipId]
  )

  const requestNetworkInfo = useCallback(
    (rpcUrl: string, chainId: bigint) => {
      setRequestedNetworkInfo({ rpcUrl, chainId: chainId.toString() })
      networksDispatch({
        type: 'method',
        params: {
          method: 'setNetworkToAddOrUpdate',
          args: [{ rpcUrl, chainId }]
        }
      })
    },
    [networksDispatch]
  )

  const resetNetworkInfo = useCallback(() => {
    setRequestedNetworkInfo(null)
    networksDispatch({
      type: 'method',
      params: {
        method: 'setNetworkToAddOrUpdate',
        args: [null]
      }
    })
  }, [networksDispatch])

  useEffect(() => {
    resetNetworkInfo()
  }, [resetNetworkInfo])

  const validateRpcUrlAndRecalculateFeatures = useCallback(
    async (
      rpcUrl?: string,
      chainId?: string | number,
      type: 'add' | 'change' = 'change'
    ): Promise<boolean> => {
      rpcCheckRunIdRef.current += 1
      const runId = rpcCheckRunIdRef.current
      const isLatestRun = () => runId === rpcCheckRunIdRef.current

      const fail = () => {
        if (isLatestRun()) {
          setPendingRpcCheckType(null)
          // Only on failure, so a successful run replaces the previous info instead of
          // clearing it - clearing it would render as "nothing requested" for a frame.
          if (type === 'change') resetNetworkInfo()
        }

        return false
      }

      const succeed = () => {
        if (isLatestRun()) setPendingRpcCheckType(null)

        return true
      }

      setPendingRpcCheckType(type)

      // On the chain id path no RPC URL is passed, so the already selected one is checked
      const rpcUrlToValidate = rpcUrl || selectedRpcUrl
      if (!rpcUrlToValidate) return fail()
      if (!rpcUrl && !chainId) return fail()

      if (rpcUrl && !rpcUrl.startsWith('http')) {
        setError('rpcUrl', {
          type: 'custom-error',
          message: 'RPC URLs must include the correct HTTP/HTTPS prefix'
        })
        return fail()
      }

      if (rpcUrl && !isValidURL(rpcUrl)) {
        setError('rpcUrl', { type: 'custom-error', message: 'Invalid RPC URL' })
        return fail()
      }

      if (rpcUrl && rpcUrls.includes(rpcUrl)) {
        setError('rpcUrl', { type: 'custom-error', message: 'RPC URL already added' })
        return fail()
      }

      let rpcChainId: bigint
      try {
        rpcChainId = await getRpcChainId(rpcUrlToValidate, chainId)
      } catch {
        // An unreachable endpoint is the expected outcome here, not a defect
        setError('rpcUrl', { type: 'custom-error', message: 'Invalid RPC URL' })
        return fail()
      }

      let validatedChainId = chainId
      if (!validatedChainId) {
        validatedChainId = Number(rpcChainId).toString()
        // The `watch` subscription reacts to this write, so mark the value as the form's
        // own to keep it from starting a second check for a chain id nobody typed.
        autoFilledChainIdRef.current = validatedChainId
        setValue('chainId', validatedChainId)
      }

      if (Number(rpcChainId) !== Number(validatedChainId)) {
        setError('rpcUrl', {
          type: 'custom-error',
          message: `RPC chain id ${rpcChainId} does not match ${selectedNetwork?.name} chain id ${validatedChainId}`
        })
        return fail()
      }

      if (
        allNetworks.find((n) => n.chainId === rpcChainId) &&
        selectedChainId === 'add-custom-network'
      ) {
        setError('rpcUrl', {
          type: 'custom-error',
          message: `You already have a network with RPC chain id ${rpcChainId}`
        })
        return fail()
      }

      if (
        type === 'change' &&
        (rpcUrlToValidate !== selectedNetwork?.selectedRpcUrl ||
          Number(validatedChainId) !== Number(selectedNetwork?.chainId))
      ) {
        requestNetworkInfo(rpcUrlToValidate, rpcChainId)
      }

      clearErrors('rpcUrl')
      return succeed()
    },
    [
      selectedRpcUrl,
      rpcUrls,
      requestNetworkInfo,
      resetNetworkInfo,
      setError,
      allNetworks,
      selectedChainId,
      selectedNetwork?.selectedRpcUrl,
      selectedNetwork?.chainId,
      selectedNetwork?.name,
      clearErrors,
      setValue
    ]
  )

  useEffect(() => {
    // We can't just validate using a custom validate rule, because getNetwork is async
    // and resetting the form doesn't wait for the validation to finish so we get an error
    // when resetting the form.
    const subscription = watch(async (value, { name }) => {
      if (name && !value[name]) {
        if (name !== 'rpcUrl' && name !== 'customBundlerUrl' && name !== 'isColibriEnabled') {
          setError(name, { type: 'custom-error', message: 'Field is required' })
          return
        }
      }

      if (name === 'name') {
        if (
          selectedChainId === 'add-custom-network' &&
          allNetworks.some((n) => n.name.toLowerCase() === value.name?.toLowerCase())
        ) {
          setError('name', {
            type: 'custom-error',
            message: `Network with name: ${value.name} already added`
          })
          return
        }
        clearErrors('name')
      }

      if (name === 'nativeAssetSymbol') {
        clearErrors('nativeAssetSymbol')
      }

      if (name === 'nativeAssetName') {
        clearErrors('nativeAssetName')
      }

      if (name === 'chainId') {
        if (
          selectedChainId === 'add-custom-network' &&
          allNetworks.some((n) => Number(n.chainId) === Number(value.chainId))
        ) {
          setError('chainId', {
            type: 'custom-error',
            message: `Network with chainID: ${value.chainId} already added`
          })
          return
        }
        clearErrors('chainId')
      }

      if (name === 'chainId') {
        if (String(value.chainId) === autoFilledChainIdRef.current) {
          autoFilledChainIdRef.current = undefined
        } else {
          await validateRpcUrlAndRecalculateFeatures(undefined, value.chainId)
        }
      }

      if (name === 'explorerUrl') {
        if (!value.explorerUrl) {
          setError('explorerUrl', { type: 'custom-error', message: 'URL cannot be empty' })
          return
        }

        try {
          const url = new URL(value.explorerUrl)
          if (url.protocol !== 'https:') {
            setError('explorerUrl', {
              type: 'custom-error',
              message: 'URL must start with https://'
            })
            return
          }
        } catch {
          setError('explorerUrl', { type: 'custom-error', message: 'Invalid URL' })
          return
        }
        clearErrors('explorerUrl')
      }

      if (name === 'rpcUrl') {
        clearErrors('rpcUrl')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [
    selectedChainId,
    allNetworks,
    touchedFields,
    validateRpcUrlAndRecalculateFeatures,
    clearErrors,
    setError,
    watch
  ])

  useEffect(() => {
    if (statuses.addNetwork === 'SUCCESS') {
      addToast('Network successfully added!')
      !!onSaved && onSaved()
    }
  }, [addToast, onSaved, statuses.addNetwork])

  useEffect(() => {
    if (statuses.updateNetwork === 'SUCCESS') {
      addToast(`${selectedNetwork?.name} settings saved!`)
      !!onSaved && onSaved()
    }
  }, [addToast, onSaved, selectedNetwork?.name, statuses.updateNetwork])

  const handleSubmitButtonPress = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    handleSubmit(async (formFields: any) => {
      const emptyFields = getEmptyRequiredNetworkFields(
        formFields,
        selectedChainId === 'add-custom-network'
      )

      if (!rpcUrls.length)
        setError('rpcUrl', {
          type: 'custom-error',
          message: 'At least one RPC URL should be added'
        })

      emptyFields.forEach((k) => {
        setError(k as any, { type: 'custom-error', message: 'Field is required' })
      })

      if (emptyFields.length || !rpcUrls.length || !selectedRpcUrl) return

      const isColibriEnabled = !!networkFormValues.isColibriEnabled && shouldShowColibriSettings

      if (selectedChainId === 'add-custom-network') {
        networksDispatch({
          type: 'method',
          params: {
            method: 'addNetwork',
            args: [
              {
                ...networkFormValues,
                name: networkFormValues.name,
                nativeAssetSymbol: networkFormValues.nativeAssetSymbol,
                nativeAssetName: networkFormValues.nativeAssetName,
                explorerUrl: networkFormValues.explorerUrl,
                rpcUrls,
                selectedRpcUrl,
                chainId: BigInt(networkFormValues.chainId),
                iconUrls: [],
                customBundlerUrl: networkFormValues.customBundlerUrl,
                isColibriEnabled
              }
            ]
          }
        })
      } else {
        networksDispatch({
          type: 'method',
          params: {
            method: 'updateNetwork',
            args: [
              {
                rpcUrls,
                selectedRpcUrl,
                explorerUrl: networkFormValues.explorerUrl,
                customBundlerUrl: networkFormValues.customBundlerUrl,
                isColibriEnabled
              },
              BigInt(networkFormValues.chainId)
            ]
          }
        })
      }
    })()
  }

  const handleSelectRpcUrl = useCallback(
    (url: string) => {
      if (selectedRpcUrl !== url) {
        setSelectedRpcUrl(url)

        const chainId = watch('chainId')
        if (chainId) requestNetworkInfo(url, BigInt(chainId))
      }
    },
    [selectedRpcUrl, requestNetworkInfo, watch]
  )

  const handleRemoveRpcUrl = useCallback(
    (url: string) => {
      if (rpcUrls.length <= 1) {
        addToast('There must be at least one RPC provider', { type: 'error' })
        return
      }
      const filteredRpcUrls = rpcUrls.filter((u) => u !== url)
      if (url === selectedRpcUrl) {
        if (filteredRpcUrls.length) {
          handleSelectRpcUrl(filteredRpcUrls[0]!)
        }
      }
      setRpcUrls(filteredRpcUrls)
    },
    [rpcUrls, selectedRpcUrl, addToast, handleSelectRpcUrl]
  )

  const handleAddRpcUrl = useCallback(
    async (value: string) => {
      const trimmedVal = value.trim()
      const isValid = await validateRpcUrlAndRecalculateFeatures(
        trimmedVal,
        watch('chainId'),
        'add'
      )
      if (!isValid) return

      setRpcUrls((p) => [trimmedVal, ...p])
      if (!rpcUrls.length) {
        handleSelectRpcUrl(trimmedVal)
      }
    },
    [rpcUrls.length, watch, handleSelectRpcUrl, validateRpcUrlAndRecalculateFeatures]
  )

  const isSaveOrAddButtonDisabled = useMemo(
    () =>
      !!errorCount ||
      // `errorCount` stays 0 until the first submit attempt (the form validates on
      // submit), so check the required fields directly to keep the button from
      // going clickable while one is still empty
      getEmptyRequiredNetworkFields(networkFormValues, selectedChainId === 'add-custom-network')
        .length > 0 ||
      !!pendingRpcCheckType ||
      // Nothing to submit until an RPC URL is selected, which is also what
      // `handleSubmitButtonPress` requires
      !selectedRpcUrl ||
      features.some((f) => f.level === 'loading') ||
      // The features stream in one by one and are all resolved before `flagged` is known,
      // so they cannot answer whether the check is over
      (!!requestedNetworkInfo && isNetworkInfoPending(networkToAddOrUpdate?.info)) ||
      !!features.filter((f) => f.id === 'flagged')[0],
    // errorCount must be a dependency in order to re-calculate the value when
    // errors change. Using errors as a dependency doesn't work
    [
      errorCount,
      networkFormValues,
      selectedChainId,
      features,
      pendingRpcCheckType,
      networkToAddOrUpdate?.info,
      requestedNetworkInfo,
      selectedRpcUrl
    ]
  )

  const displayedRpcUrls = useMemo(
    () => (isMobile && !showAllRpcUrls ? rpcUrls.slice(0, COLLAPSED_RPC_URLS_COUNT) : rpcUrls),
    [rpcUrls, showAllRpcUrls]
  )

  const rpcUrlsList = useMemo(
    () =>
      rpcUrls.length ? (
        displayedRpcUrls.map((url, i) => {
          let removeDisabledReason: string | undefined

          if (rpcUrls.length === 1) {
            removeDisabledReason = 'There must be at least one RPC provider'
          } else if (url === selectedNetwork?.selectedRpcUrl) {
            removeDisabledReason = 'Cannot remove the selected RPC URL'
          } else if (url.includes('invictus.ambire.com')) {
            removeDisabledReason = 'Default RPC URL cannot be removed'
          }

          return (
            <RpcSelectorItem
              key={url}
              index={i}
              url={url}
              selectedRpcUrl={selectedRpcUrl}
              rpcUrlsLength={rpcUrls.length}
              onPress={handleSelectRpcUrl}
              shouldShowRemove
              removeDisabledReason={removeDisabledReason}
              onRemove={handleRemoveRpcUrl}
            />
          )
        })
      ) : (
        <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter, spacings.pvLg]}>
          <Text fontSize={14} style={text.center} appearance="secondaryText">
            {t('No RPC URLs added yet')}
          </Text>
        </View>
      ),
    [
      rpcUrls.length,
      displayedRpcUrls,
      selectedNetwork?.selectedRpcUrl,
      selectedRpcUrl,
      handleSelectRpcUrl,
      handleRemoveRpcUrl,
      t
    ]
  )

  return (
    <>
      <View style={styles.modalHeader}>
        {selectedChainId === 'add-custom-network' && (
          <Text
            fontSize={20}
            weight="medium"
            numberOfLines={1}
            style={[text.center, flexbox.flex1]}
          >
            {t('Add custom network')}
          </Text>
        )}
        {selectedChainId !== 'add-custom-network' && !!selectedNetwork && (
          <>
            {isWeb && (
              <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
                <NetworkIcon
                  id={selectedNetwork.chainId.toString()}
                  style={spacings.mrTy}
                  size={28}
                />
                <Text
                  appearance="secondaryText"
                  weight="regular"
                  style={spacings.mrMi}
                  fontSize={16}
                >
                  {selectedNetwork.name || t('Unknown network')}
                </Text>
              </View>
            )}
            <Text fontSize={20} weight="medium" numberOfLines={1}>
              {t('Edit network')}
            </Text>
            <View style={[flexbox.flex1, flexbox.alignEnd]}>
              {isMobile && (
                <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
                  <NetworkIcon
                    id={selectedNetwork.chainId.toString()}
                    style={spacings.mrTy}
                    size={28}
                  />
                  <Text
                    appearance="secondaryText"
                    weight="regular"
                    style={spacings.mrMi}
                    fontSize={16}
                  >
                    {selectedNetwork.name || t('Unknown network')}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
      <View
        style={[
          isWeb && spacings.phXl,
          isWeb && spacings.pvXl,
          isWeb && spacings.ptLg,
          flexbox.flex1
        ]}
      >
        {isWeb && (
          <Text fontSize={18} weight="medium" style={spacings.mbMd}>
            {t('Network details')}
          </Text>
        )}
        <View style={[isWeb && flexbox.directionRow, flexbox.flex1]}>
          <View style={flexbox.flex1}>
            <ScrollableWrapper contentContainerStyle={{ flexGrow: 1 }}>
              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    backgroundColor={theme.secondaryBackground}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    inputWrapperStyle={{ height: 40 }}
                    inputStyle={{ height: 40 }}
                    containerStyle={{ ...spacings.mb, ...(isWeb ? spacings.mrMi : {}), flex: 1 }}
                    label={t('Network name')}
                    disabled={selectedChainId !== 'add-custom-network'}
                    error={handleErrors(errors.name)}
                  />
                )}
                name="name"
              />
              <View style={[flexbox.directionRow, flexbox.alignStart]}>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...spacings.mb, flex: 1 }}
                      label={t('Currency Symbol')}
                      disabled={selectedChainId !== 'add-custom-network'}
                      error={handleErrors(errors.nativeAssetSymbol)}
                    />
                  )}
                  name="nativeAssetSymbol"
                />
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...spacings.mb, ...spacings.mlMi, flex: 1 }}
                      label={t('Currency Name')}
                      disabled={selectedChainId !== 'add-custom-network'}
                      error={handleErrors(errors.nativeAssetName)}
                    />
                  )}
                  name="nativeAssetName"
                />
              </View>

              <Controller
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[flexbox.directionRow, flexbox.alignStart]}>
                    <Input
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...spacings.mb, ...spacings.mrTy, flex: 1 }}
                      label={t('Add RPC URL')}
                      error={handleErrors(errors.rpcUrl)}
                    />
                    <View style={{ paddingTop: 27 }}>
                      <Button
                        text={
                          value.length && !errors.rpcUrl && !!pendingRpcCheckType
                            ? t('Adding...')
                            : t('Add')
                        }
                        type="gray"
                        disabled={
                          !value.length ||
                          (!!errors.rpcUrl &&
                            errors.rpcUrl.message !== 'At least one RPC URL should be added') ||
                          !!pendingRpcCheckType
                        }
                        containerStyle={{ height: 40 }}
                        style={{ height: 40 }}
                        onPress={() => handleAddRpcUrl(value)}
                      />
                    </View>
                  </View>
                )}
                name="rpcUrl"
              />

              <Text appearance="secondaryText" fontSize={14} weight="regular" style={spacings.mbMi}>
                {rpcUrls.length > 1 ? t('Select default RPC URL') : 'Default RPC URL'}
              </Text>
              {isWeb ? (
                <ScrollableWrapper
                  style={[
                    styles.rpcUrlsContainer,
                    // @ts-expect-error the ScrollableWrapper expects ViewStyle
                    // but the below style is legit as well
                    { flex: 'unset', minHeight: rpcUrls.length > 1 ? 80 : 40 }
                  ]}
                  contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
                >
                  {rpcUrlsList}
                </ScrollableWrapper>
              ) : (
                <View style={[styles.rpcUrlsContainer, { maxHeight: undefined }]}>
                  {rpcUrlsList}
                  {rpcUrls.length > COLLAPSED_RPC_URLS_COUNT && (
                    <Pressable
                      style={[
                        spacings.phTy,
                        flexbox.directionRow,
                        flexbox.alignCenter,
                        spacings.pbSm,
                        spacings.ptMi,
                        flexbox.alignSelfCenter
                      ]}
                      onPress={() => setShowAllRpcUrls((p) => !p)}
                    >
                      <Text style={spacings.mrMi} fontSize={12} color={theme.linkText} underline>
                        {!showAllRpcUrls &&
                          t('show {{number}} more', {
                            number: rpcUrls.length - COLLAPSED_RPC_URLS_COUNT
                          })}
                        {!!showAllRpcUrls &&
                          t('hide {{number}} urls', {
                            number: rpcUrls.length - COLLAPSED_RPC_URLS_COUNT
                          })}
                      </Text>
                      {!!showAllRpcUrls && (
                        <UpArrowIcon
                          width={12}
                          height={6}
                          color={theme.linkText}
                          strokeWidth="1.7"
                        />
                      )}
                      {!showAllRpcUrls && (
                        <DownArrowIcon
                          width={12}
                          height={6}
                          color={theme.linkText}
                          strokeWidth="1.7"
                        />
                      )}
                    </Pressable>
                  )}
                </View>
              )}
              {isMobile && (
                <View style={spacings.mbSm}>
                  <NetworkAvailableFeatures
                    chainId={selectedNetwork?.chainId}
                    features={features}
                    title={t('Default RPC available features')}
                  />
                </View>
              )}
              {shouldShowColibriSettings && (
                <Controller
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <Checkbox
                      value={!!value}
                      style={flexbox.alignCenter}
                      onValueChange={onChange}
                      isDisabled={isMobile}
                    >
                      <Pressable
                        style={[flexbox.directionRow, flexbox.alignCenter]}
                        onPress={() => onChange(!value)}
                        disabled={isMobile}
                      >
                        <Image
                          source={colibriLogo as ImageSourcePropType}
                          style={{ width: 22, height: 22, marginRight: 8 }}
                          resizeMode="contain"
                        />
                        <Text appearance="secondaryText" fontSize={12} shouldScale={false}>
                          {t('Enable Colibri for RPC verification')}
                        </Text>
                        {isMobile && (
                          <View style={spacings.mlMi}>
                            <InfoIcon
                              width={16}
                              height={16}
                              dataSet={colibriTooltipDataSet}
                              accessibilityLabel={colibriTooltipContent}
                            />
                          </View>
                        )}
                      </Pressable>
                    </Checkbox>
                  )}
                  name="isColibriEnabled"
                />
              )}

              <View style={[flexbox.directionRow, flexbox.alignStart]}>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <NumberInput
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value as any}
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...(isWeb ? spacings.mrMi : {}), flex: 1 }}
                      label={t('Chain ID')}
                      disabled={selectedChainId !== 'add-custom-network'}
                      error={handleErrors(errors.chainId)}
                    />
                  )}
                  name="chainId"
                />
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...spacings.mlMi, flex: 2 }}
                      label={t('Block Explorer URL')}
                      error={handleErrors(errors.explorerUrl)}
                    />
                  )}
                  name="explorerUrl"
                />
              </View>
              <View style={[flexbox.directionRow, flexbox.alignStart]}>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <NumberInput
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value as any}
                      disabled
                      placeholder="Coming soon..."
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...(isWeb ? spacings.mrMi : {}), flex: 1 }}
                      label={t('Coingecko platform ID')}
                      error={handleErrors(errors.coingeckoPlatformId)}
                    />
                  )}
                  name="coingeckoPlatformId"
                />
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      disabled
                      placeholder="Coming soon..."
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...spacings.mlMi, flex: 1 }}
                      label={isMobile ? t('Coingecko asset ID') : t('Coingecko native asset ID')}
                      error={handleErrors(errors.coingeckoNativeAssetId)}
                    />
                  )}
                  name="coingeckoNativeAssetId"
                />
              </View>
              <View style={[flexbox.directionRow, flexbox.alignStart]}>
                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      backgroundColor={theme.secondaryBackground}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      leftIcon={() => {
                        return (
                          <>
                            <WarningIcon
                              color={theme.warningDecorative}
                              data-tooltip-id="customBundlerId"
                            />
                            <Tooltip
                              id="customBundlerId"
                              content="The custom bundler is an experimental feature. The extension may not work well with it. Proceed with caution"
                            />
                          </>
                        )
                      }}
                      inputWrapperStyle={{ height: 40 }}
                      inputStyle={{ height: 40 }}
                      containerStyle={{ ...spacings.mb, ...(isWeb ? spacings.mrMi : {}), flex: 1 }}
                      label={t('Custom bundler url (Experimental)')}
                      error={handleErrors(errors.customBundlerUrl)}
                    />
                  )}
                  name="customBundlerUrl"
                />
              </View>
            </ScrollableWrapper>
          </View>
          <View style={[flexbox.flex1, isWeb && spacings.pl, isWeb && spacings.ml]}>
            {isWeb && (
              <ScrollableWrapper contentContainerStyle={{ flexGrow: 1 }}>
                <View style={flexbox.flex1}>
                  <NetworkAvailableFeatures
                    chainId={selectedNetwork?.chainId}
                    features={features}
                  />
                </View>
              </ScrollableWrapper>
            )}
            <View style={[isWeb && flexbox.alignEnd, isMobile ? {} : spacings.ptXl]}>
              {selectedChainId === 'add-custom-network' ? (
                <Button
                  onPress={handleSubmitButtonPress}
                  text={t('Add network')}
                  disabled={isSaveOrAddButtonDisabled}
                  hasBottomSpacing={false}
                  size="large"
                />
              ) : (
                <View style={[flexbox.directionRow, isMobile && { columnGap: SPACING_SM }]}>
                  <Button
                    onPress={onCancel}
                    text={t('Cancel')}
                    type="outline"
                    hasBottomSpacing={false}
                    style={[
                      flexbox.flex1,
                      isWeb && spacings.mrSm,
                      isWeb && { width: 90 },
                      isMobile && { backgroundColor: theme.neutral100 }
                    ]}
                    size="smaller"
                  />
                  <Button
                    onPress={handleSubmitButtonPress}
                    text={isSomethingUpdated ? t('Save') : t('No changes')}
                    disabled={!isSomethingUpdated || isSaveOrAddButtonDisabled}
                    style={[isWeb && spacings.mlMi, flexbox.flex1, isWeb && { minWidth: 124 }]}
                    hasBottomSpacing={false}
                    size="smaller"
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </>
  )
}

export default React.memo(NetworkForm)
