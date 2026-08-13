import { formatUnits } from 'ethers'
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed, SpeedCalc, Warning } from '@ambire-common/interfaces/signAccountOp'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import AssetIcon from '@common/assets/svg/AssetIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import FeeIcon from '@common/assets/svg/FeeIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import SettingsWheelIcon from '@common/assets/svg/SettingsWheelIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Select, { SectionedSelect } from '@common/components/Select'
import { RenderSelectedOptionParams, SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import { isMobile, isWeb } from '@common/config/env'
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
import PendingTransactions from '@common/modules/sign-account-op/components/PendingTransactions'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { NO_FEE_OPTIONS } from './consts'
import { getFeeOptionValue, mapFeeOptions, sortFeeOptions } from './helpers'
import getStyles from './styles'
import { DispatchUpdate, Props } from './types'

const FEE_SECTION_LIST_MENU_HEADER_HEIGHT = 34
const ADVANCED_OPTIONS_TOOLTIP_ID = 'sign-account-op-advanced-options-tooltip'

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
  payValue,
  isValue
}: {
  speed: SpeedCalc
  feeTokenPriceUnavailableWarning?: Warning
  payValue?: SelectValue
  isValue?: boolean
}) => {
  const { t } = useTranslation()

  if (isValue) {
    return (
      <Text fontSize={14} appearance="secondaryText" testID={SPEED_TEST_IDS[speed.type]}>
        {t(getFeeSpeedLabelText(speed))}
      </Text>
    )
  }

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
      <Text fontSize={isMobile ? 14 : 12} style={spacings.mrMi}>
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
  isViewOnly,
  shouldShowTxnDetails = false
}: Props) => {
  const { dispatch: signAccountOpDispatch } = useController('SignAccountOpController')
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')
  const { dispatch: transferDispatch } = useController('TransferController')
  const { state } = useController('AddressBookController')
  const { networks } = useController('NetworksController').state
  const { t } = useTranslation()
  const { theme } = useTheme(getStyles)
  const {
    ref: customGasPriceSheetRef,
    open: openCustomGasPriceSheet,
    close: closeCustomGasPriceSheet
  } = useModalize()

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

  const selectedFee = useMemo(() => {
    const selectedOption =
      feeSpeedOptions.find(({ value }) => value === signAccountOpState?.selectedFeeSpeed) ||
      feeSpeedOptions[0]

    if (!selectedOption) return null

    return {
      ...selectedOption,
      label: (
        <FeeSpeedLabel
          speed={selectedOption.speed}
          feeTokenPriceUnavailableWarning={feeTokenPriceUnavailableWarning}
          payValue={payValue}
          isValue
        />
      )
    }
  }, [
    feeSpeedOptions,
    feeTokenPriceUnavailableWarning,
    payValue,
    signAccountOpState?.selectedFeeSpeed
  ])

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

  const feeOptionSelectSections = useMemo(() => {
    if (!payOptionsPaidByUsOrGasTank.length && !payOptionsPaidByEOA.length)
      return [
        {
          data: [NO_FEE_OPTIONS],
          key: 'no-options'
        }
      ]

    return [
      {
        title: {
          icon: FeeIcon,
          text: t('Fee tokens in this account')
        },
        data: payOptionsPaidByUsOrGasTank,
        key: 'account-tokens'
      },
      {
        title: {
          icon: AssetIcon,
          text: t('Native tokens from my EOAs')
        },
        data: payOptionsPaidByEOA,
        key: 'eoa-tokens'
      }
    ]
  }, [payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank, t])

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
    const selectedGasPrice = signAccountOpState?.gasPrices?.[selectedFeeSpeed]?.maxFeePerGas

    if (!selectedGasPrice || !signAccountOpState?.selectedOption) return ''

    return formatUnits(BigInt(selectedGasPrice), 'gwei')
  }, [
    signAccountOpState?.gasPrices,
    signAccountOpState?.selectedFeeSpeed,
    signAccountOpState?.selectedOption
  ])

  const currentMaxPriorityFeePerGas = useMemo(() => {
    const selectedFeeSpeed = signAccountOpState?.selectedFeeSpeed || FeeSpeed.Fast
    const selectedGasPrice = signAccountOpState?.gasPrices?.[selectedFeeSpeed]?.maxPriorityFeePerGas

    if (!selectedGasPrice || !signAccountOpState?.selectedOption) return ''

    return formatUnits(BigInt(selectedGasPrice), 'gwei')
  }, [
    signAccountOpState?.gasPrices,
    signAccountOpState?.selectedFeeSpeed,
    signAccountOpState?.selectedOption
  ])

  const currentGas = signAccountOpState?.accountOp.gasFeePayment?.simulatedGasLimit.toString() || ''
  const canSetCustomGasPrices = !!signAccountOpState?.canSetCustomGasPrices
  const canSetCustomGas = !!signAccountOpState?.canSetCustomGas

  const advancedOptionsTooltip = useMemo(() => {
    if (canSetCustomGasPrices) return undefined

    return `Advanced options are only applicable for EOA accounts broadcasting in ${
      network?.nativeAssetSymbol || signAccountOpState?.selectedOption?.token.symbol || ''
    }`
  }, [
    canSetCustomGasPrices,
    network?.nativeAssetSymbol,
    signAccountOpState?.selectedOption?.token.symbol
  ])

  const openAdvancedOptions = useCallback(() => {
    if (!canSetCustomGasPrices) return

    openCustomGasPriceSheet()
  }, [canSetCustomGasPrices, openCustomGasPriceSheet])

  const estimationTitle = useMemo(() => {
    if (!signAccountOpState?.canAccountBroadcastByItself) return t('Broadcast from')

    return t('Network fee')
  }, [signAccountOpState?.canAccountBroadcastByItself, t])

  const renderAdvancedButton = useCallback(() => {
    const advancedButtonContent = (
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <SettingsWheelIcon width={16} height={16} color={theme.secondaryText} />
        <Text fontSize={14} appearance="secondaryText" style={[spacings.mlTy, spacings.mrMi]}>
          {t('Advanced')}
        </Text>
        <RightArrowIcon width={6} height={12} color={theme.secondaryText} weight="2" />
      </View>
    )

    // On mobile only the icon is displayed, because the fee speed select shares the title row
    if (isMobile) {
      return (
        <Pressable
          disabled={!canSetCustomGasPrices}
          onPress={openAdvancedOptions}
          style={!canSetCustomGasPrices && { opacity: 0.3 }}
          testID="advanced-options-button"
        >
          <SettingsIcon width={24} height={24} color={theme.secondaryText} />
        </Pressable>
      )
    }

    return (
      <Button
        type="ghost"
        size="tiny"
        disabled={!canSetCustomGasPrices}
        onPress={openAdvancedOptions}
        hasBottomSpacing={false}
        shouldScaleChildrenOnHover={false}
        testID="advanced-options-button"
        style={{
          alignSelf: 'flex-end',
          paddingHorizontal: 0,
          minHeight: 0
        }}
      >
        {advancedButtonContent}
      </Button>
    )
  }, [canSetCustomGasPrices, openAdvancedOptions, t, theme.secondaryText])

  const renderFeeSpeedSelectedOption = useCallback(
    ({ toggleMenu, isMenuOpen, selectRef }: RenderSelectedOptionParams) => {
      if (!selectedFee) return null

      return (
        <Pressable
          onPress={toggleMenu}
          disabled={disabled}
          style={[flexbox.directionRow, flexbox.alignCenter, disabled && { opacity: 0.6 }]}
          testID="fee-speed-select-trigger"
        >
          <View ref={selectRef} style={[flexbox.directionRow, flexbox.alignCenter]}>
            {selectedFee.label}
            <View style={spacings.mlMi}>
              {isMenuOpen ? (
                <UpArrowIcon width={12} height={7} />
              ) : (
                <DownArrowIcon width={12} height={7} />
              )}
            </View>
          </View>
        </Pressable>
      )
    },
    [disabled, selectedFee]
  )

  const renderFeeSpeedSelect = useCallback(() => {
    if (!selectedFee) return null

    // On mobile the select sits next to the title, so it keeps its own boxed appearance
    if (isMobile) {
      return (
        <Select
          value={selectedFee}
          // @ts-expect-error TODO: types mismatch
          setValue={onFeeSelect}
          options={feeSpeedOptions}
          selectStyle={{ height: 40, backgroundColor: theme.secondaryBackground }}
          bottomSheetTitle={t('Network fee')}
          withSearch={false}
          containerStyle={{ ...spacings.mb0, width: 126 }}
          disabled={disabled}
          testID="fee-speed-select"
        />
      )
    }

    return (
      <Select
        value={selectedFee}
        // @ts-expect-error TODO: types mismatch
        setValue={onFeeSelect}
        options={feeSpeedOptions}
        renderSelectedOption={renderFeeSpeedSelectedOption}
        menuOptionHeight={isWeb ? 40 : undefined}
        // Display a wider menu if the fee token price is unavailable
        // as the native amount takes up more space
        menuLeftHorizontalOffset={feeTokenPriceUnavailableWarning ? 160 : 100}
        menuStyle={{ width: feeTokenPriceUnavailableWarning ? 200 : 148 }}
        menuPosition="top"
        bottomSheetTitle={t('Network fee')}
        withSearch={false}
        containerStyle={{
          ...spacings.mb0,
          ...spacings.mrTy,
          width: 'auto',
          alignSelf: 'flex-end'
        }}
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
    t,
    theme.secondaryBackground
  ])

  const renderFeeOptionSectionHeader = useCallback(({ section }: any) => {
    if (section.data.length === 0 || !section.title) return null

    return <TitleAndIcon icon={section.title.icon} title={section.title.text} />
  }, [])

  if (!hasEstimation && !!slowRequest) {
    return (
      <View style={spacings.ptTy}>
        <Alert
          type="warning"
          size="sm"
          title="Estimating this transaction is taking an unexpectedly long time. We'll keep trying, but it is possible that there's an issue with this network or RPC - please change your RPC provider or contact Ambire support if this issue persists."
        />
      </View>
    )
  }

  if (signAccountOpState && signAccountOpState.estimation.status === EstimationStatus.Error) {
    return null
  }

  if (
    !signAccountOpState ||
    (!hasEstimation && signAccountOpState.estimation.estimationRetryError) ||
    !payValue
  ) {
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
      {!!isOneClick && shouldShowTxnDetails && (
        <View style={spacings.mv}>
          <PendingTransactions
            network={network}
            setDelegation={signAccountOpState?.accountOp.meta?.setDelegation}
            delegatedContract={signAccountOpState?.delegatedContract}
            hideDeleteIcon
            signAccountOpState={signAccountOpState}
            size="md"
          />
        </View>
      )}
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
          spacings.mbTy,
          isMobile && spacings.ptSm
        ]}
      >
        {isMobile ? (
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}>
            <Text fontSize={18} weight="medium">
              {estimationTitle}
            </Text>
            {signAccountOpState.canAccountBroadcastByItself && (
              <View
                style={spacings.mlTy}
                dataSet={
                  advancedOptionsTooltip
                    ? createGlobalTooltipDataSet({
                        id: ADVANCED_OPTIONS_TOOLTIP_ID,
                        content: advancedOptionsTooltip
                      })
                    : undefined
                }
              >
                {renderAdvancedButton()}
              </View>
            )}
          </View>
        ) : (
          <>
            <Text fontSize={18} weight="medium">
              {estimationTitle}
            </Text>
            {signAccountOpState.canAccountBroadcastByItself && (
              <View
                dataSet={
                  advancedOptionsTooltip
                    ? createGlobalTooltipDataSet({
                        id: ADVANCED_OPTIONS_TOOLTIP_ID,
                        content: advancedOptionsTooltip
                      })
                    : undefined
                }
              >
                {renderAdvancedButton()}
              </View>
            )}
          </>
        )}
        {isMobile && renderFeeSpeedSelect()}
      </View>
      <View>
        {!isMobile && (
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mbTy
            ]}
          >
            <Text fontSize={14} appearance="secondaryText">
              {t('Pay with')}
            </Text>
            <DefaultFeeSelector
              networkName={network?.name}
              payValue={payValue}
              signAccountOpState={signAccountOpState}
              dispatchUpdate={dispatchUpdate}
              hasManyPayOptionsByUsOrGasTank={payOptionsPaidByUsOrGasTank.length > 1}
              baselineFeeOption={baselineFeeOption}
              style={[flexbox.alignCenter, spacings.mb0]}
            />
          </View>
        )}
        <SectionedSelect
          setValue={setFeeOption}
          testID="fee-option-select"
          headerHeight={FEE_SECTION_LIST_MENU_HEADER_HEIGHT}
          sections={feeOptionSelectSections}
          renderSectionHeader={renderFeeOptionSectionHeader}
          containerStyle={spacings.mb0}
          value={payValue || NO_FEE_OPTIONS}
          disabled={
            disabled ||
            (!payOptionsPaidByUsOrGasTank.length && !payOptionsPaidByEOA.length) ||
            !signAccountOpState.selectedOption
          }
          selectStyle={{
            backgroundColor:
              isOneClick || isMobile ? theme.secondaryBackground : theme.primaryBackground,
            ...spacings.phSm
          }}
          defaultValue={payValue ?? undefined}
          withSearch={!!payOptionsPaidByUsOrGasTank.length || !!payOptionsPaidByEOA.length}
          stickySectionHeadersEnabled
          menuPosition="top"
          bottomSheetTitle={t('Network fee')}
        />
        {isMobile && (
          <DefaultFeeSelector
            networkName={network?.name}
            payValue={payValue}
            signAccountOpState={signAccountOpState}
            dispatchUpdate={dispatchUpdate}
            hasManyPayOptionsByUsOrGasTank={payOptionsPaidByUsOrGasTank.length > 1}
            baselineFeeOption={baselineFeeOption}
            style={[flexbox.alignCenter, spacings.mtSm, spacings.mb0]}
          />
        )}
      </View>
      {!isMobile && (
        <>
          {!!selectedFee && (
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifySpaceBetween,
                spacings.mtSm
              ]}
            >
              <Text fontSize={14} appearance="secondaryText">
                {t('Speed')}
              </Text>
              {renderFeeSpeedSelect()}
            </View>
          )}
        </>
      )}
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
