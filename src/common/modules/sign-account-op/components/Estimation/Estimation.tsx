import { formatUnits } from 'ethers'
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import {
  EstimationFailureKind,
  EstimationStatus
} from '@ambire-common/controllers/estimation/types'
import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed, SpeedCalc, Warning } from '@ambire-common/interfaces/signAccountOp'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import AssetIcon from '@common/assets/svg/AssetIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import FeeIcon from '@common/assets/svg/FeeIcon'
import GaugeIcon from '@common/assets/svg/GaugeIcon'
import LinkIcon from '@common/assets/svg/LinkIcon'
import MultiKeysIcon from '@common/assets/svg/MultiKeysIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Alert from '@common/components/Alert'
import HoverablePressable from '@common/components/HoverablePressable'
import Select, { SectionedSelect } from '@common/components/Select'
import { RenderSelectedOptionParams, SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import BundlerWarning from '@common/modules/sign-account-op/components/Estimation/components/bundlerWarning'
import CustomGasPrice from '@common/modules/sign-account-op/components/Estimation/components/CustomGasPrice'
import DefaultFeeSelector from '@common/modules/sign-account-op/components/Estimation/components/DefaultFeeSelector'
import EstimationSkeleton from '@common/modules/sign-account-op/components/Estimation/components/EstimationSkeleton'
import ExtremeGasFeeWarning from '@common/modules/sign-account-op/components/Estimation/components/ExtremeGasFeeWarning'
import PayOption from '@common/modules/sign-account-op/components/Estimation/components/PayOption'
import ServiceFee from '@common/modules/sign-account-op/components/Estimation/components/ServiceFee'
import Sponsored from '@common/modules/sign-account-op/components/Estimation/components/Sponsored'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { NO_FEE_OPTIONS } from './consts'
import { getFeeOptionValue, groupSafeFeeOptions, mapFeeOptions, sortFeeOptions } from './helpers'
import getStyles from './styles'
import { DispatchUpdate, Props } from './types'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const FEE_SECTION_LIST_MENU_HEADER_HEIGHT = 34
// The web menu opens under the speed select, but needs extra room for "Medium <$0.01"
const FEE_SPEED_MENU_EXTRA_WIDTH = 100

export const SPEED_TEST_IDS = {
  slow: 'option-slow',
  medium: 'option-medium',
  fast: 'option-fast',
  ape: 'option-ape'
}

const getFeeSpeedLabelText = (speed: SpeedCalc) =>
  speed.type.charAt(0).toUpperCase() + speed.type.slice(1)

const FeeSpeedLabel = ({
  speed,
  feeTokenPriceUnavailableWarning,
  payValue
}: {
  speed: SpeedCalc
  feeTokenPriceUnavailableWarning?: Warning
  payValue?: SelectValue
}) => {
  const { t } = useTranslation()
  const { isCompactLayout } = useCompactLayout()

  return (
    <View
      style={[
        flexbox.flex1,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween
      ]}
      testID={SPEED_TEST_IDS[speed.type]}
    >
      {/* Matches the selected value's size where the select is boxed (mobile, narrow web) */}
      <Text fontSize={isCompactLayout ? 14 : 12} style={spacings.mrMi}>
        {t(getFeeSpeedLabelText(speed))}
      </Text>
      <Text
        fontSize={!feeTokenPriceUnavailableWarning ? 14 : 12}
        style={spacings.mlMi}
        numberOfLines={1}
        weight={!feeTokenPriceUnavailableWarning ? 'regular' : 'medium'}
        appearance="secondaryText"
      >
        {!feeTokenPriceUnavailableWarning
          ? formatDecimals(Number(speed.amountUsd), 'value')
          : `${formatDecimals(Number(speed.amountFormatted), 'precise')} ${payValue?.token.symbol}`}
      </Text>
    </View>
  )
}

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const Estimation = ({
  signAccountOpState,
  disabled,
  hasEstimation,
  isSponsored,
  sponsor,
  updateType,
  slowRequest,
  bundlerNonceDiscrepancy,
  serviceFee,
  isOneClick,
  isViewOnly
}: Props) => {
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { dispatch: transferDispatch } = useController('TransferController')
  const { state } = useController('AddressBookController')
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const {
    ref: customGasPriceSheetRef,
    open: openCustomGasPriceSheet,
    close: closeCustomGasPriceSheet
  } = useModalize()

  // The estimation failed for a reason that may resolve on its own and there is
  // no previous result to fall back on, so it keeps asking in the background
  const isRetryingEstimation =
    !hasEstimation && signAccountOpState?.estimation.failureKind === EstimationFailureKind.Retriable

  const feeTokenPriceUnavailableWarning = useMemo(() => {
    return signAccountOpState?.warnings.find((warning) => warning.id === 'feeTokenPriceUnavailable')
  }, [signAccountOpState?.warnings])

  const payOptionsPaidByUsOrGasTank = useMemo(() => {
    if (!signAccountOpState?.estimation.availableFeeOptions.length || !hasEstimation) return []

    return signAccountOpState.estimation.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy === signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) =>
        mapFeeOptions(feeOption, signAccountOpState, state.contacts, !!isViewOnly)
      )
  }, [hasEstimation, signAccountOpState, state.contacts, isViewOnly])

  const payOptionsPaidByEOA = useMemo(() => {
    if (!signAccountOpState?.estimation.availableFeeOptions.length || !hasEstimation) return []

    return signAccountOpState.estimation.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy !== signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) =>
        mapFeeOptions(feeOption, signAccountOpState, state.contacts, !!isViewOnly)
      )
  }, [hasEstimation, signAccountOpState, state.contacts, isViewOnly])

  const controllerSelectedFeeOption = signAccountOpState?.selectedOption
    ? getFeeOptionValue(signAccountOpState.selectedOption)
    : null
  const [selectedFeeOptionOverride, setSelectedFeeOptionOverride] = useState<{
    value: SelectValue['value']
    controllerSelectedFeeOption: SelectValue['value'] | null
  } | null>(null)
  const selectedFeeOption =
    selectedFeeOptionOverride?.controllerSelectedFeeOption === controllerSelectedFeeOption
      ? selectedFeeOptionOverride.value
      : controllerSelectedFeeOption
  const selectedFeeSpeed = signAccountOpState?.selectedFeeSpeed
  const [isEnableErc4337PromptDismissed, setIsEnableErc4337PromptDismissed] = useState(false)
  // What was selected right before the user's first change on this screen. Going
  // back to it means no different default is being proposed anymore, and null
  // means the user hasn't touched the field at all
  const [baselineFeeOption, setBaselineFeeOption] = useState<SelectValue['value'] | null>(null)

  const dispatchUpdate = useCallback<DispatchUpdate>(
    (update) => {
      if (updateType === 'Swap&Bridge') {
        swapAndBridgeDispatch({
          type: 'method',
          params: {
            method: 'callSignAccountOpMethod',
            args: ['update', [update]]
          }
        })
      } else if (updateType === 'Transfer&TopUp') {
        transferDispatch({
          type: 'method',
          params: {
            method: 'callSignAccountOpMethod',
            args: ['update', [update]]
          }
        })
      } else {
        signAccountOpDispatch({
          type: 'method',
          params: {
            method: 'update',
            args: [update]
          }
        })
      }
    },
    [swapAndBridgeDispatch, transferDispatch, signAccountOpDispatch, updateType]
  )

  const enableErc4337AndReestimate = useCallback(() => {
    if (updateType === 'Swap&Bridge') {
      swapAndBridgeDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['enableErc4337AndReestimate', []]
        }
      })
    } else if (updateType === 'Transfer&TopUp') {
      transferDispatch({
        type: 'method',
        params: {
          method: 'callSignAccountOpMethod',
          args: ['enableErc4337AndReestimate', []]
        }
      })
    } else {
      signAccountOpDispatch({
        type: 'method',
        params: {
          method: 'enableErc4337AndReestimate',
          args: []
        }
      })
    }
  }, [signAccountOpDispatch, swapAndBridgeDispatch, transferDispatch, updateType])

  const dismissEnableErc4337Prompt = useCallback(() => {
    setIsEnableErc4337PromptDismissed(true)
  }, [])

  const setFeeOption = useCallback(
    (localPayValue: any) => {
      if (!selectedFeeSpeed || localPayValue.value === selectedFeeOption) return
      setBaselineFeeOption((prev) => prev ?? selectedFeeOption)
      setSelectedFeeOptionOverride({
        value: localPayValue.value,
        controllerSelectedFeeOption
      })

      dispatchUpdate({
        feeToken: localPayValue.token,
        paidBy: localPayValue.paidBy,
        speed: localPayValue.speedCoverage.includes(selectedFeeSpeed)
          ? selectedFeeSpeed
          : FeeSpeed.Fast
      })
    },
    [controllerSelectedFeeOption, dispatchUpdate, selectedFeeOption, selectedFeeSpeed]
  )

  const payValue = useMemo(() => {
    const result =
      payOptionsPaidByUsOrGasTank.find(({ value }) => value === selectedFeeOption) ||
      payOptionsPaidByEOA.find(({ value }) => value === selectedFeeOption)

    // If result becomes undefined because of a recalculation to availableFeeOptions,
    // use the first available option from whatever is available.
    if (result === undefined && selectedFeeOption) {
      const firstOption = payOptionsPaidByUsOrGasTank[0] || payOptionsPaidByEOA[0]
      if (!firstOption) return undefined

      return firstOption
    }

    return result
  }, [payOptionsPaidByUsOrGasTank, payOptionsPaidByEOA, selectedFeeOption])

  const fallbackDispatchKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!payValue || !selectedFeeOption || payValue.value === selectedFeeOption) {
      fallbackDispatchKeyRef.current = null
      return
    }

    const dispatchKey = `${selectedFeeOption}-${payValue.value}`
    if (fallbackDispatchKeyRef.current === dispatchKey || !selectedFeeSpeed) return

    fallbackDispatchKeyRef.current = dispatchKey

    dispatchUpdate({
      feeToken: payValue.token,
      paidBy: payValue.paidBy,
      speed: payValue.speedCoverage.includes(selectedFeeSpeed) ? selectedFeeSpeed : FeeSpeed.Fast
    })
  }, [dispatchUpdate, payValue, selectedFeeOption, selectedFeeSpeed])

  const feeSpeeds = useMemo(() => {
    if (!signAccountOpState?.selectedOption) return []

    const identifier = getFeeSpeedIdentifier(
      signAccountOpState.selectedOption,
      signAccountOpState.accountOp.accountAddr
    )

    // The fallback array covers a corner case, that I could not reproduce,
    // but theoretically is possible - fan speed with this identifier to be missing
    return signAccountOpState.feeSpeeds[identifier] || []
  }, [
    signAccountOpState?.feeSpeeds,
    signAccountOpState?.selectedOption,
    signAccountOpState?.accountOp.accountAddr
  ])

  const isGaslessTransaction = useMemo(() => {
    return (
      feeSpeeds.every((speed) => !speed.amount) &&
      !signAccountOpState?.estimation.error &&
      !signAccountOpState?.errors.length &&
      !!feeSpeeds.length
    )
  }, [feeSpeeds, signAccountOpState?.errors.length, signAccountOpState?.estimation.error])

  const shouldShowEnableErc4337Prompt = useMemo(() => {
    if (isEnableErc4337PromptDismissed || !signAccountOpState?.canEnableErc4337 || !hasEstimation)
      return false

    const hasNoFeeOptions = !payOptionsPaidByUsOrGasTank.length && !payOptionsPaidByEOA.length
    const selectedOptionCannotCoverFee =
      !feeSpeeds.length || feeSpeeds.every((speed) => speed.disabled)

    return hasNoFeeOptions || selectedOptionCannotCoverFee
  }, [
    feeSpeeds,
    hasEstimation,
    payOptionsPaidByEOA.length,
    payOptionsPaidByUsOrGasTank.length,
    isEnableErc4337PromptDismissed,
    signAccountOpState?.canEnableErc4337
  ])

  const enableErc4337Prompt = useMemo(() => {
    if (!shouldShowEnableErc4337Prompt) return null

    return (
      <Alert
        type="info"
        size="sm"
        title={t('More fee payment options are available')}
        text={t(
          'Enable ERC-4337 to use smart account gas estimation, gas tank, sponsored gas, and token fee payments for this transaction.'
        )}
        style={spacings.mbSm}
        buttonProps={{
          text: t('Enable'),
          onPress: enableErc4337AndReestimate
        }}
        onClose={dismissEnableErc4337Prompt}
      />
    )
  }, [dismissEnableErc4337Prompt, enableErc4337AndReestimate, shouldShowEnableErc4337Prompt, t])

  const feeSpeedOptions = useMemo(() => {
    return feeSpeeds.map((speed) => ({
      label: (
        <FeeSpeedLabel
          speed={speed}
          feeTokenPriceUnavailableWarning={feeTokenPriceUnavailableWarning}
          payValue={payValue}
        />
      ),
      value: speed.type,
      speed,
      disabled: speed.disabled
    }))
  }, [feeSpeeds, feeTokenPriceUnavailableWarning, payValue])

  const selectedFee = useMemo(
    () =>
      feeSpeedOptions.find(({ value }) => value === signAccountOpState?.selectedFeeSpeed) ||
      feeSpeedOptions[0] ||
      null,
    [feeSpeedOptions, signAccountOpState?.selectedFeeSpeed]
  )

  const onFeeSelect = useCallback(
    ({ value }: { value: string }) => {
      if (!Object.values(FeeSpeed).includes(value as FeeSpeed)) {
        console.error('Invalid fee speed')
        return
      }

      dispatchUpdate({ speed: value as FeeSpeed, shouldPersistSpeed: true })
    },
    [dispatchUpdate]
  )

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === signAccountOpState?.accountOp.chainId)
  }, [networks, signAccountOpState?.accountOp.chainId])

  const safeFeePayerLinks = signAccountOpState?.safeFeePayerLinks
  const safeFeeOptionGroups = useMemo(
    () => (safeFeePayerLinks ? groupSafeFeeOptions(payOptionsPaidByEOA, safeFeePayerLinks) : null),
    [payOptionsPaidByEOA, safeFeePayerLinks]
  )

  const feeOptionSelectSections = useMemo(() => {
    if (!payOptionsPaidByUsOrGasTank.length && !payOptionsPaidByEOA.length)
      return [
        {
          data: [NO_FEE_OPTIONS],
          key: 'no-options'
        }
      ]

    const accountTokensSection = {
      title: {
        icon: FeeIcon,
        text: t('Fee tokens in this account')
      },
      data: payOptionsPaidByUsOrGasTank,
      key: 'account-tokens'
    }

    // Paying from an EOA publicly links it to the Safe, so the ones that reveal nothing new come first
    if (safeFeeOptionGroups) {
      const { owners, linked, notLinked } = safeFeeOptionGroups

      return [
        accountTokensSection,
        {
          title: { icon: MultiKeysIcon, text: t('Safe owners') },
          data: owners,
          key: 'safe-owners'
        },
        {
          title: { icon: LinkIcon, text: t('Already linked to this Safe') },
          data: linked,
          key: 'safe-linked'
        },
        {
          title: { icon: VisibilityIcon, text: t('Not linked to this Safe yet') },
          data: notLinked,
          key: 'safe-not-linked'
        }
      ]
    }

    return [
      accountTokensSection,
      {
        title: {
          icon: AssetIcon,
          text: t('Native tokens from my EOAs')
        },
        data: payOptionsPaidByEOA,
        key: 'eoa-tokens'
      }
    ]
  }, [payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank, safeFeeOptionGroups, t])

  const isFeePayerNotLinkedToSafe = !!signAccountOpState?.isFeePayerNotLinkedToSafe

  const notLinkedToSafeWarning = useMemo(() => {
    if (!isFeePayerNotLinkedToSafe || !payValue || !safeFeeOptionGroups) return null

    const getPayerName = (feeOption: { paidBy: string; paidByAccountLabel?: string }) =>
      feeOption.paidByAccountLabel || shortenAddress(feeOption.paidBy, 13)
    const linkedAlternative = [...safeFeeOptionGroups.owners, ...safeFeeOptionGroups.linked].find(
      (feeOption) => !feeOption.disabled
    )

    return (
      <Alert
        type="warning"
        size="sm"
        title={t('This links {{payer}} to this Safe', { payer: getPayerName(payValue) })}
        text={t(
          "Paying the fee from {{payer}} will show publicly that it belongs to the same owner as this Safe. This can't be undone.",
          { payer: getPayerName(payValue) }
        )}
        style={spacings.mtSm}
        buttonProps={
          linkedAlternative
            ? {
                text: t('Use {{payer}} instead', { payer: getPayerName(linkedAlternative) }),
                onPress: () => setFeeOption(linkedAlternative)
              }
            : undefined
        }
        testID="fee-payer-not-linked-to-safe-warning"
      />
    )
  }, [isFeePayerNotLinkedToSafe, payValue, safeFeeOptionGroups, setFeeOption, t])

  const nativeFeeOption = signAccountOpState?.estimation.availableFeeOptions.find(
    (feeOption) =>
      feeOption.paidBy === signAccountOpState.accountOp.accountAddr &&
      feeOption.token.address === ZERO_ADDRESS
  )

  const paidByNativeValue = useMemo(() => {
    if (!serviceFee || !signAccountOpState?.estimation.availableFeeOptions.length || !hasEstimation)
      return null

    if (!nativeFeeOption) return

    const mappedFeeOption = mapFeeOptions(
      nativeFeeOption,
      signAccountOpState,
      state.contacts,
      !!isViewOnly
    )
    mappedFeeOption.label = (
      <PayOption
        amount={BigInt(serviceFee.amount)}
        amountUsd={serviceFee.amountUSD}
        feeOption={nativeFeeOption}
        paidByAccountLabel={mappedFeeOption.paidByAccountLabel}
      />
    )
    return mappedFeeOption
  }, [serviceFee, signAccountOpState, hasEstimation, nativeFeeOption, state.contacts, isViewOnly])

  const v1warning = useMemo(() => {
    return signAccountOpState?.warnings.find((w) => w.id === 'v1Acc')
  }, [signAccountOpState?.warnings])

  const currentGasPrice = useMemo(() => {
    const selectedFeeSpeed = signAccountOpState?.selectedFeeSpeed || FeeSpeed.Fast
    const selectedGasPrice =
      signAccountOpState?.selectedOptionGasPrices?.[selectedFeeSpeed]?.maxFeePerGas

    if (!selectedGasPrice || !signAccountOpState?.selectedOption) return ''

    return formatUnits(BigInt(selectedGasPrice), 'gwei')
  }, [
    signAccountOpState?.selectedOptionGasPrices,
    signAccountOpState?.selectedFeeSpeed,
    signAccountOpState?.selectedOption
  ])

  const currentMaxPriorityFeePerGas = useMemo(() => {
    const selectedFeeSpeed = signAccountOpState?.selectedFeeSpeed || FeeSpeed.Fast
    const selectedGasPrice =
      signAccountOpState?.selectedOptionGasPrices?.[selectedFeeSpeed]?.maxPriorityFeePerGas

    if (!selectedGasPrice || !signAccountOpState?.selectedOption) return ''

    return formatUnits(BigInt(selectedGasPrice), 'gwei')
  }, [
    signAccountOpState?.selectedOptionGasPrices,
    signAccountOpState?.selectedFeeSpeed,
    signAccountOpState?.selectedOption
  ])

  const currentGas = signAccountOpState?.accountOp.gasFeePayment?.simulatedGasLimit.toString() || ''
  const canSetCustomGasPrices = !!signAccountOpState?.canSetCustomGasPrices
  const canSetCustomGas = !!signAccountOpState?.canSetCustomGas
  // The fee token select needs the opposite fill of what it sits on to stay visible
  const selectBackgroundColor =
    isOneClick || isMobile ? theme.secondaryBackground : theme.primaryBackground
  const isFeeTokenSelectDisabled =
    disabled ||
    (!payOptionsPaidByUsOrGasTank.length && !payOptionsPaidByEOA.length) ||
    !signAccountOpState?.selectedOption

  const hasSelectedFeeOption = !!signAccountOpState?.selectedOption
  // Shown in the advanced options instead of the fields, so it's clear why they can't be changed
  const customGasPricesUnavailableReason = useMemo(() => {
    if (canSetCustomGasPrices || !hasSelectedFeeOption) return undefined

    const nativeSymbol = network?.nativeAssetSymbol || ''
    // A smart account pays its own fee through a service that sets it, so only another account can.
    // An upgraded basic account (7702) can set it when paying in the native token itself
    if (isSmartAccount(signAccountOpState?.account)) {
      return t(
        'This account’s fee is handled for you. To set it yourself, pay the fee in {{nativeSymbol}} from one of your other accounts, listed under "Native tokens from my EOAs".',
        { nativeSymbol }
      )
    }

    return t(
      'This account’s fee is handled for you. To set it yourself, pay the fee in {{nativeSymbol}}.',
      { nativeSymbol }
    )
  }, [
    canSetCustomGasPrices,
    network?.nativeAssetSymbol,
    signAccountOpState?.account,
    hasSelectedFeeOption,
    t
  ])

  const openAdvancedOptions = useCallback(() => {
    openCustomGasPriceSheet()
  }, [openCustomGasPriceSheet])

  const estimationTitle = useMemo(() => {
    if (!signAccountOpState?.canAccountBroadcastByItself) return t('Broadcast from')

    return t('Network fee')
  }, [signAccountOpState?.canAccountBroadcastByItself, t])

  const renderFeeSpeedSelectedOption = useCallback(
    ({ toggleMenu, isMenuOpen, selectRef }: RenderSelectedOptionParams) => {
      if (!selectedFee) return null

      return (
        <HoverablePressable
          onPress={toggleMenu}
          disabled={disabled}
          style={[flexbox.directionRow, flexbox.alignCenter, disabled && { opacity: 0.6 }]}
          testID="fee-speed-select-trigger"
        >
          <View ref={selectRef} style={[flexbox.directionRow, flexbox.alignCenter]}>
            <GaugeIcon width={15} height={18} style={spacings.mrTy} />
            <Text
              fontSize={14}
              weight="medium"
              numberOfLines={1}
              testID={SPEED_TEST_IDS[selectedFee.speed.type]}
            >
              {t(getFeeSpeedLabelText(selectedFee.speed))}
            </Text>
            <View style={spacings.mlTy}>
              {isMenuOpen ? (
                <UpArrowIcon width={12} height={7} strokeWidth="1.8" />
              ) : (
                <DownArrowIcon width={12} height={7} strokeWidth="1.8" />
              )}
            </View>
          </View>
        </HoverablePressable>
      )
    },
    [disabled, selectedFee, t]
  )

  const renderFeeSpeedSelect = useCallback(() => {
    if (!selectedFee) return null

    return (
      <Select
        value={selectedFee}
        // @ts-expect-error TODO: types mismatch
        setValue={onFeeSelect}
        options={feeSpeedOptions}
        renderSelectedOption={renderFeeSpeedSelectedOption}
        menuOptionHeight={isWeb ? 40 : undefined}
        // Grows the menu to the left, as the select sits at the right of the row.
        // Wider still if the fee token price is unavailable as the token amount takes up more space
        menuLeftHorizontalOffset={
          FEE_SPEED_MENU_EXTRA_WIDTH + (feeTokenPriceUnavailableWarning ? 60 : 0)
        }
        menuPosition="top"
        bottomSheetTitle={t('Transaction speed')}
        withSearch={false}
        containerStyle={{ ...spacings.mb0, width: 'auto' }}
        disabled={disabled}
        testID="fee-speed-select"
      />
    )
  }, [
    disabled,
    feeSpeedOptions,
    feeTokenPriceUnavailableWarning,
    onFeeSelect,
    renderFeeSpeedSelectedOption,
    selectedFee,
    t
  ])

  const renderFeeOptionSectionHeader = useCallback(({ section }: any) => {
    if (section.data.length === 0 || !section.title) return null

    return <TitleAndIcon icon={section.title.icon} title={section.title.text} />
  }, [])

  // A failure the estimation is still retrying keeps the "longer than usual"
  // warning below. Anything else is a dead end and is rendered elsewhere
  if (
    signAccountOpState &&
    signAccountOpState.estimation.status === EstimationStatus.Error &&
    !isRetryingEstimation
  ) {
    return null
  }

  if (!hasEstimation && (!!slowRequest || isRetryingEstimation)) {
    const messagePrefix = slowRequest
      ? 'Estimating this transaction is taking longer than usual.'
      : 'Estimating this transaction failed.'
    return (
      <View style={spacings.ptTy}>
        <Alert
          type="warning"
          size="sm"
          title={`${messagePrefix} We'll keep trying, but it is possible that there's an issue with this network or RPC - please change your RPC provider or contact Ambire support if this issue persists.`}
        />
      </View>
    )
  }

  if (!signAccountOpState || !payValue) {
    if (enableErc4337Prompt) {
      return <View style={spacings.ptTy}>{enableErc4337Prompt}</View>
    }

    return (
      <EstimationSkeleton
        // Overwrite the appearance in Swap/Transfer as the background behind the skeleton is different
        // and it isn't visible in dark mode otherwise
        appearance={updateType === 'Requests' ? undefined : 'tertiaryBackground'}
      />
    )
  }

  if (isSponsored) {
    return (
      <>
        {(!serviceFee || !paidByNativeValue || !nativeFeeOption) && (
          <Sponsored sponsor={sponsor} isOneClick={isOneClick} />
        )}
        <ServiceFee
          serviceFee={serviceFee}
          paidByNativeValue={paidByNativeValue}
          nativeFeeOption={nativeFeeOption}
        />
      </>
    )
  }

  if (isGaslessTransaction) {
    return (
      <Alert
        type="success"
        size="md"
        text={t('No fee payment required- this is a gasless (meta) transaction.')}
        style={spacings.mbSm}
      />
    )
  }

  return (
    <Fragment>
      <CustomGasPrice
        backgroundColor={theme.tertiaryBackground}
        closeBottomSheet={() => closeCustomGasPriceSheet()}
        canSetCustomGas={canSetCustomGas}
        unavailableReason={customGasPricesUnavailableReason}
        currentGas={currentGas}
        currentMaxFeePerGas={currentGasPrice}
        currentMaxPriorityFeePerGas={currentMaxPriorityFeePerGas}
        is1559={network?.feeOptions?.is1559 === true}
        onSaveCustomGasPrices={(customGasPrices, customGasLimit) =>
          dispatchUpdate({ customGasPrices, customGasLimit })
        }
        selectedOption={signAccountOpState.selectedOption}
        sheetRef={customGasPriceSheetRef}
      />
      <View>
        {!isViewOnly && (
          <ExtremeGasFeeWarning
            signAccountOpState={signAccountOpState}
            networkChainId={network?.chainId}
          />
        )}
        <BundlerWarning
          signAccountOpState={signAccountOpState}
          bundlerNonceDiscrepancy={bundlerNonceDiscrepancy}
        />
        {enableErc4337Prompt}
      </View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mbSm
        ]}
      >
        <Text fontSize={16} weight="medium" numberOfLines={1} style={flexbox.flex1}>
          {estimationTitle}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {renderFeeSpeedSelect()}
          {signAccountOpState.canAccountBroadcastByItself && (
            <>
              {/* Only separates the speed select from the gear, so it goes away with the select */}
              {!!selectedFee && <View style={[styles.feeHeaderDivider, spacings.mhSm]} />}
              <HoverablePressable
                onPress={openAdvancedOptions}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('Advanced fee settings')}
                testID="advanced-options-button"
              >
                <SettingsIcon width={20} height={20} color={theme.secondaryText} />
              </HoverablePressable>
            </>
          )}
        </View>
      </View>
      <SectionedSelect
        setValue={setFeeOption}
        testID="fee-option-select"
        headerHeight={FEE_SECTION_LIST_MENU_HEADER_HEIGHT}
        sections={feeOptionSelectSections}
        renderSectionHeader={renderFeeOptionSectionHeader}
        containerStyle={spacings.mb0}
        value={payValue || NO_FEE_OPTIONS}
        disabled={isFeeTokenSelectDisabled}
        selectStyle={{ backgroundColor: selectBackgroundColor, ...spacings.phSm }}
        defaultValue={payValue ?? undefined}
        withSearch={!!payOptionsPaidByUsOrGasTank.length || !!payOptionsPaidByEOA.length}
        stickySectionHeadersEnabled
        menuPosition="top"
        bottomSheetTitle={t('Network fee')}
      />
      {notLinkedToSafeWarning}
      <DefaultFeeSelector
        networkName={network?.name}
        payValue={payValue}
        signAccountOpState={signAccountOpState}
        dispatchUpdate={dispatchUpdate}
        hasManyPayOptionsByUsOrGasTank={payOptionsPaidByUsOrGasTank.length > 1}
        baselineFeeOption={baselineFeeOption}
        style={[flexbox.alignCenter, spacings.mtSm, spacings.mb0]}
      />
      <ServiceFee
        serviceFee={serviceFee}
        paidByNativeValue={paidByNativeValue}
        nativeFeeOption={nativeFeeOption}
      />
      {v1warning && !signAccountOpState.errors.length && (
        <View
          style={[
            flexbox.directionRow,
            spacings.mt,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween
          ]}
        >
          <Text fontSize={12} appearance="warningText" style={spacings.mr}>
            {t(v1warning.title)}
          </Text>
        </View>
      )}
    </Fragment>
  )
}

export default React.memo(Estimation)
