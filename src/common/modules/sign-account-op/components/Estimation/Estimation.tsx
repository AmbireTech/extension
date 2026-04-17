import { formatUnits, parseUnits, toBeHex } from 'ethers'
import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed, SpeedCalc } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { Hex } from '@ambire-common/interfaces/hex'
import { Warning } from '@ambire-common/interfaces/signAccountOp'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { GasSpeeds } from '@ambire-common/services/bundlers/types'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import AssetIcon from '@common/assets/svg/AssetIcon'
import FeeIcon from '@common/assets/svg/FeeIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NumberInput from '@common/components/NumberInput'
import Select, { SectionedSelect } from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import BundlerWarning from '@common/modules/sign-account-op/components/Estimation/components/bundlerWarning'
import EstimationSkeleton from '@common/modules/sign-account-op/components/Estimation/components/EstimationSkeleton'
import PayOption from '@common/modules/sign-account-op/components/Estimation/components/PayOption'
import ServiceFee from '@common/modules/sign-account-op/components/Estimation/components/ServiceFee'
import Sponsored from '@common/modules/sign-account-op/components/Estimation/components/Sponsored'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { NO_FEE_OPTIONS } from './consts'
import { mapFeeOptions, sortFeeOptions } from './helpers'
import getStyles from './styles'
import { Props } from './types'

const FEE_SECTION_LIST_MENU_HEADER_HEIGHT = 34
const ADVANCED_OPTIONS_TOOLTIP_ID = 'sign-account-op-advanced-options-tooltip'

export const SPEED_TEST_IDS = {
  slow: 'option-slow',
  medium: 'option-medium',
  fast: 'option-fast',
  ape: 'option-ape'
}

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
      <Text weight="medium" fontSize={isMobile ? 14 : 12} style={spacings.mrMi}>
        {t(speed.type.charAt(0).toUpperCase() + speed.type.slice(1))}
      </Text>
      {!isValue && (
        <Text
          fontSize={!feeTokenPriceUnavailableWarning ? 14 : 12}
          style={spacings.mlMi}
          numberOfLines={1}
          weight={!feeTokenPriceUnavailableWarning ? 'regular' : 'medium'}
          appearance="secondaryText"
        >
          {!feeTokenPriceUnavailableWarning
            ? formatDecimals(Number(speed.amountUsd), 'value')
            : `${formatDecimals(Number(speed.amountFormatted), 'precise')} ${
                payValue?.token.symbol
              }`}
        </Text>
      )}
    </View>
  )
}

type CustomGasPriceInputProps = {
  initialAmount: string
  backgroundColor: ColorValue
  onSanitizedAmountChange: (value: string) => void
  inputError: string | boolean
  decimals?: number
  symbol?: string
}

const CustomGasPriceInput = memo(
  ({
    initialAmount,
    backgroundColor,
    onSanitizedAmountChange,
    inputError,
    decimals,
    symbol
  }: CustomGasPriceInputProps) => {
    const { t } = useTranslation()
    const [draftAmount, setDraftAmount] = useState(initialAmount)

    useEffect(() => {
      setDraftAmount(initialAmount)
    }, [initialAmount])

    const onChange = useCallback(
      (text: string) => {
        setDraftAmount(text)
        onSanitizedAmountChange(text.replace(',', '.'))
      },
      [onSanitizedAmountChange]
    )

    const onBlur = useCallback(() => {
      const sanitized = draftAmount.trim().replace(',', '.')
      setDraftAmount(sanitized)
      onSanitizedAmountChange(sanitized)
    }, [draftAmount, onSanitizedAmountChange])

    return (
      <NumberInput
        label={t('Gas price ({{symbol}})', { symbol })}
        placeholder={t('Enter gas price')}
        value={draftAmount}
        onChangeText={onChange}
        onBlur={onBlur}
        precision={decimals || 18}
        error={inputError}
        info={t('Set the gas price in the chain native token per gas unit.')}
        autoFocus
        backgroundColor={backgroundColor}
      />
    )
  }
)

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
  isOneClick
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
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState, state.contacts))
  }, [hasEstimation, signAccountOpState, state.contacts])

  const payOptionsPaidByEOA = useMemo(() => {
    if (!signAccountOpState?.estimation.availableFeeOptions.length || !hasEstimation) return []

    return signAccountOpState.estimation.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy !== signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState, state.contacts))
  }, [hasEstimation, signAccountOpState, state.contacts])

  const [selectedFeeOption, setSelectedFeeOption] = useState<SelectValue['value'] | null>(null)
  const [customGasPriceError, setCustomGasPriceError] = useState<string | boolean>(false)
  const customGasPriceRef = useRef('')
  const [initialCustomGasPrice, setInitialCustomGasPrice] = useState('')

  const dispatchUpdate = useCallback(
    (update: {
      feeToken?: SelectValue['token']
      paidBy?: string
      speed?: FeeSpeed
      customGasPrices?: GasSpeeds
    }) => {
      signAccountOpDispatch({
        type: 'method',
        params: {
          method: 'update',
          args: [update]
        }
      })
    },
    [signAccountOpDispatch]
  )

  const payValue = useMemo(() => {
    return (
      payOptionsPaidByUsOrGasTank.find(({ value }) => value === selectedFeeOption) ||
      payOptionsPaidByEOA.find(({ value }) => value === selectedFeeOption)
    )
  }, [payOptionsPaidByUsOrGasTank, payOptionsPaidByEOA, selectedFeeOption])

  const setFeeOption = useCallback(
    (localPayValue: any, skipDispatch?: boolean) => {
      if (!signAccountOpState?.selectedFeeSpeed) return
      setSelectedFeeOption(localPayValue.value)

      if (!skipDispatch) {
        dispatchUpdate({
          feeToken: localPayValue.token,
          paidBy: localPayValue.paidBy,
          speed: localPayValue.speedCoverage.includes(signAccountOpState.selectedFeeSpeed)
            ? signAccountOpState.selectedFeeSpeed
            : FeeSpeed.Fast
        })
      }
    },
    [dispatchUpdate, signAccountOpState?.selectedFeeSpeed]
  )

  useEffect(() => {
    if (!hasEstimation || !signAccountOpState) return

    if (!payValue && signAccountOpState.selectedOption) {
      setFeeOption(
        mapFeeOptions(signAccountOpState.selectedOption, signAccountOpState, state.contacts),
        true
      )
    }
  }, [payValue, setFeeOption, hasEstimation, signAccountOpState, state.contacts])
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
        // eslint-disable-next-line no-console
        console.error('Invalid fee speed')
        return
      }

      dispatchUpdate({
        speed: value as FeeSpeed
      })
    },
    [dispatchUpdate]
  )

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
          text: t('With fee tokens from current account')
        },
        data: payOptionsPaidByUsOrGasTank,
        key: 'account-tokens'
      },
      {
        title: {
          icon: AssetIcon,
          text: t('With native assets of my EOA accounts')
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

    const mappedFeeOption = mapFeeOptions(nativeFeeOption, signAccountOpState, state.contacts)
    mappedFeeOption.label = (
      <PayOption
        amount={BigInt(serviceFee.amount)}
        amountUsd={serviceFee.amountUSD}
        feeOption={nativeFeeOption}
        paidByAccountLabel={mappedFeeOption.paidByAccountLabel}
      />
    )
    return mappedFeeOption
  }, [serviceFee, signAccountOpState, hasEstimation, nativeFeeOption, state.contacts])

  const v1warning = useMemo(() => {
    return signAccountOpState?.warnings.find((w) => w.id === 'v1Acc')
  }, [signAccountOpState?.warnings])

  const network = useMemo(() => {
    return networks.find((n) => n.chainId === signAccountOpState?.accountOp.chainId)
  }, [networks, signAccountOpState?.accountOp.chainId])

  const currentGasPrice = useMemo(() => {
    const selectedFeeSpeed = signAccountOpState?.selectedFeeSpeed || FeeSpeed.Fast
    const selectedGasPrice = signAccountOpState?.gasPrices?.[selectedFeeSpeed]?.maxFeePerGas

    if (!selectedGasPrice || !signAccountOpState?.selectedOption) return ''

    return formatUnits(
      BigInt(selectedGasPrice),
      signAccountOpState.selectedOption.token.decimals || 18
    )
  }, [
    signAccountOpState?.gasPrices,
    signAccountOpState?.selectedFeeSpeed,
    signAccountOpState?.selectedOption
  ])

  const canSetCustomGasPrices = !!signAccountOpState?.canSetCustomGasPrices

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

    customGasPriceRef.current = currentGasPrice
    setInitialCustomGasPrice(currentGasPrice)
    setCustomGasPriceError(false)
    openCustomGasPriceSheet()
  }, [canSetCustomGasPrices, currentGasPrice, openCustomGasPriceSheet])

  const onCustomGasPriceChange = useCallback(
    (value: string) => {
      customGasPriceRef.current = value
      if (customGasPriceError) setCustomGasPriceError(false)
    },
    [customGasPriceError]
  )

  const saveCustomGasPrice = useCallback(() => {
    if (!signAccountOpState?.selectedOption) return

    const normalizedValue = customGasPriceRef.current.trim().replace(',', '.')

    if (!normalizedValue) {
      setCustomGasPriceError(t('Enter a gas price'))
      return
    }

    try {
      const gasPrice = parseUnits(
        normalizedValue,
        signAccountOpState.selectedOption.token.decimals || 18
      )

      if (gasPrice <= 0n) {
        setCustomGasPriceError(t('Enter a valid gas price'))
        return
      }

      const gasPriceHex = toBeHex(gasPrice) as Hex
      const customGasPrices: GasSpeeds = {
        slow: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        },
        medium: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        },
        fast: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        },
        ape: {
          maxFeePerGas: gasPriceHex,
          maxPriorityFeePerGas: gasPriceHex
        }
      }

      dispatchUpdate({ customGasPrices })
      closeCustomGasPriceSheet()
    } catch {
      setCustomGasPriceError(t('Enter a valid gas price'))
    }
  }, [closeCustomGasPriceSheet, dispatchUpdate, signAccountOpState?.selectedOption, t])

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
      <BottomSheet
        id="custom-gas-price-sheet"
        sheetRef={customGasPriceSheetRef}
        closeBottomSheet={closeCustomGasPriceSheet}
        type="modal"
      >
        <ModalHeader title={t('Advanced options')} handleClose={closeCustomGasPriceSheet} />
        <CustomGasPriceInput
          initialAmount={initialCustomGasPrice}
          backgroundColor={theme.primaryBackground}
          onSanitizedAmountChange={onCustomGasPriceChange}
          inputError={customGasPriceError}
          decimals={signAccountOpState.selectedOption?.token.decimals}
          symbol={signAccountOpState.selectedOption?.token.symbol || network?.nativeAssetSymbol}
        />
        <FooterGlassView absolute={false} isSimpleBlur={false} size="sm" style={spacings.mtLg}>
          <Button
            type="secondary"
            text={t('Cancel')}
            onPress={() => closeCustomGasPriceSheet()}
            hasBottomSpacing={false}
            style={{ flex: 1, width: 100, ...spacings.mrSm }}
            size="smaller"
          />
          <Button
            type="primary"
            text={t('Save')}
            onPress={saveCustomGasPrice}
            hasBottomSpacing={false}
            style={{ flex: 1, width: 100 }}
            size="smaller"
          />
        </FooterGlassView>
      </BottomSheet>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mbSm,
          isMobile && spacings.ptSm
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={20} weight="medium">
            {t(signAccountOpState.canAccountBroadcastByItself ? 'Pay fee with' : 'Broadcast from')}
          </Text>
          <View
            dataSet={
              advancedOptionsTooltip
                ? createGlobalTooltipDataSet({
                    id: ADVANCED_OPTIONS_TOOLTIP_ID,
                    content: advancedOptionsTooltip
                  })
                : undefined
            }
            style={spacings.mlTy}
          >
            <Button
              type="ghost"
              size="tiny"
              text={t('Advanced options')}
              textUnderline
              disabled={!canSetCustomGasPrices}
              onPress={openAdvancedOptions}
              hasBottomSpacing={false}
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 0,
                minHeight: 0
              }}
              textStyle={{ color: theme.secondaryText }}
            />
          </View>
        </View>
        {selectedFee && (
          <Select
            value={selectedFee}
            // @ts-ignore
            setValue={onFeeSelect}
            options={feeSpeedOptions}
            selectStyle={{
              height: 40,
              backgroundColor:
                isOneClick || isMobile ? theme.secondaryBackground : theme.primaryBackground
            }}
            menuOptionHeight={isWeb ? 40 : undefined}
            // Display a wider menu if the fee token price is unavailable
            // as the native amount takes up more space
            menuLeftHorizontalOffset={feeTokenPriceUnavailableWarning ? 100 : 48}
            menuStyle={{ minWidth: feeTokenPriceUnavailableWarning ? 200 : 148 }}
            bottomSheetTitle={t('Gas fee')}
            withSearch={false}
            containerStyle={{ ...spacings.mb0, width: isWeb ? 116 : 126 }}
            testID="fee-speed-select"
          />
        )}
      </View>
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
        bottomSheetTitle={t('Gas token')}
      />
      <ServiceFee
        serviceFee={serviceFee}
        paidByNativeValue={paidByNativeValue}
        nativeFeeOption={nativeFeeOption}
      />
      <BundlerWarning
        signAccountOpState={signAccountOpState}
        bundlerNonceDiscrepancy={bundlerNonceDiscrepancy}
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
