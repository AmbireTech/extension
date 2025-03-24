import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'

import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed, SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import AssetIcon from '@common/assets/svg/AssetIcon'
import FeeIcon from '@common/assets/svg/FeeIcon'
import Alert from '@common/components/Alert'
import Select, { SectionedSelect } from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import Warnings from '@web/modules/sign-account-op/components/Warnings'

import AmountInfo from './components/AmountInfo'
import EstimationSkeleton from './components/EstimationSkeleton'
import { NO_FEE_OPTIONS } from './consts'
import { getDefaultFeeOption, mapFeeOptions, sortFeeOptions } from './helpers'
import { Props } from './types'

const FEE_SECTION_LIST_MENU_HEADER_HEIGHT = 34

const Estimation = ({
  signAccountOpState,
  disabled,
  hasEstimation,
  slowRequest,
  slowPaymasterRequest,
  isViewOnly,
  isSponsored,
  sponsor
}: Props) => {
  const estimationFailed = signAccountOpState?.status?.type === SigningStatus.EstimationError
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { minWidthSize } = useWindowSize()

  const feeTokenPriceUnavailableWarning = useMemo(() => {
    return signAccountOpState?.warnings.find((warning) => warning.id === 'feeTokenPriceUnavailable')
  }, [signAccountOpState?.warnings])

  const payOptionsPaidByUsOrGasTank = useMemo(() => {
    if (!signAccountOpState?.availableFeeOptions.length || !hasEstimation) return []

    return signAccountOpState.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy === signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState))
  }, [hasEstimation, signAccountOpState])

  const payOptionsPaidByEOA = useMemo(() => {
    if (!signAccountOpState?.availableFeeOptions.length || !hasEstimation) return []

    return signAccountOpState.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy !== signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState))
  }, [hasEstimation, signAccountOpState])

  const defaultFeeOption = useMemo(
    () => getDefaultFeeOption(payOptionsPaidByUsOrGasTank, payOptionsPaidByEOA),
    [payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank]
  )

  const [selectedFeeOption, setSelectedFeeOption] = useState<SelectValue['value'] | null>(null)

  const payValue = useMemo(() => {
    return (
      payOptionsPaidByUsOrGasTank.find(({ value }) => value === selectedFeeOption) ||
      payOptionsPaidByEOA.find(({ value }) => value === selectedFeeOption)
    )
  }, [payOptionsPaidByUsOrGasTank, payOptionsPaidByEOA, selectedFeeOption])

  const setFeeOption = useCallback(
    (localPayValue: any) => {
      if (!signAccountOpState?.selectedFeeSpeed) return
      setSelectedFeeOption(localPayValue.value)

      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          feeToken: localPayValue.token,
          paidBy: localPayValue.paidBy,
          speed: localPayValue.speedCoverage.includes(signAccountOpState.selectedFeeSpeed)
            ? signAccountOpState.selectedFeeSpeed
            : FeeSpeed.Fast
        }
      })
    },
    [dispatch, signAccountOpState?.selectedFeeSpeed]
  )

  useEffect(() => {
    if (!hasEstimation) return

    const isInitialValueSet = !!payValue
    const canPayFeeAfterNotBeingAbleToPayInitially =
      payValue?.value === NO_FEE_OPTIONS.value && defaultFeeOption.value !== NO_FEE_OPTIONS.value
    const feeOptionNoLongerViable = payValue?.disabled !== defaultFeeOption.disabled

    if (
      !isInitialValueSet ||
      canPayFeeAfterNotBeingAbleToPayInitially ||
      feeOptionNoLongerViable ||
      (payValue &&
        !payOptionsPaidByUsOrGasTank.find(
          (payOption) =>
            payOption.paidBy === payValue.paidBy &&
            payOption.token.address === payValue.token?.address
        ) &&
        !payOptionsPaidByEOA.find(
          (payOption) =>
            payOption.paidBy === payValue.paidBy &&
            payOption.token.address === payValue.token?.address
        ))
    ) {
      setFeeOption(defaultFeeOption)
    }
  }, [
    payValue,
    setFeeOption,
    hasEstimation,
    defaultFeeOption.value,
    defaultFeeOption,
    signAccountOpState?.account.addr,
    payOptionsPaidByUsOrGasTank,
    payOptionsPaidByEOA
  ])

  const feeSpeeds = useMemo(() => {
    if (!signAccountOpState?.selectedOption) return []

    const identifier = getFeeSpeedIdentifier(
      signAccountOpState.selectedOption,
      signAccountOpState.accountOp.accountAddr,
      signAccountOpState.rbfAccountOps[signAccountOpState.selectedOption.paidBy]
    )
    return signAccountOpState.feeSpeeds[identifier].map((speed) => ({
      ...speed,
      disabled: !!(
        signAccountOpState.selectedOption &&
        signAccountOpState.selectedOption.availableAmount < speed.amount
      )
    }))
  }, [
    signAccountOpState?.feeSpeeds,
    signAccountOpState?.selectedOption,
    signAccountOpState?.accountOp.accountAddr,
    signAccountOpState?.rbfAccountOps
  ])

  const isGaslessTransaction = useMemo(() => {
    return (
      feeSpeeds.every((speed) => !speed.amount) &&
      !signAccountOpState?.estimation?.error &&
      !signAccountOpState?.errors.length &&
      !!feeSpeeds.length
    )
  }, [feeSpeeds, signAccountOpState?.errors.length, signAccountOpState?.estimation?.error])

  const feeSpeedOptions = useMemo(() => {
    return feeSpeeds.map((speed) => ({
      label: (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text weight="medium" fontSize={12} style={spacings.mrMi}>
            {t(speed.type.charAt(0).toUpperCase() + speed.type.slice(1))}
          </Text>
          <Text fontSize={14} style={spacings.mlMi} weight="regular" appearance="secondaryText">
            {formatDecimals(Number(speed.amountUsd), 'value')}
          </Text>
        </View>
      ),
      value: speed.type
    }))
  }, [feeSpeeds, t])

  const selectedFee = useMemo(
    () =>
      feeSpeedOptions.find(({ value }) => value === signAccountOpState?.selectedFeeSpeed) ||
      feeSpeedOptions[0],
    [feeSpeedOptions, signAccountOpState?.selectedFeeSpeed]
  )

  const onFeeSelect = useCallback(
    ({ value }: { value: string }) => {
      if (!Object.values(FeeSpeed).includes(value as FeeSpeed)) {
        console.error('Invalid fee speed')
        return
      }

      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          speed: value as FeeSpeed
        }
      })
    },
    [dispatch]
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
          icon: <FeeIcon color={theme.secondaryText} width={16} height={16} />,
          text: t('With fee tokens from current account')
        },
        data: payOptionsPaidByUsOrGasTank,
        key: 'account-tokens'
      },
      {
        title: {
          icon: <AssetIcon color={theme.secondaryText} width={16} height={16} />,
          text: t('With native assets of my basic accounts')
        },
        data: payOptionsPaidByEOA,
        key: 'eoa-tokens'
      }
    ]
  }, [payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank, t, theme.secondaryText])

  const renderFeeOptionSectionHeader = useCallback(
    ({ section }: any) => {
      if (section.data.length === 0 || !section.title) return null

      return (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phTy,
            spacings.pvTy,
            {
              backgroundColor: theme.primaryBackground,
              height: FEE_SECTION_LIST_MENU_HEADER_HEIGHT
            },
            section?.key === 'eoa-tokens' && {
              borderTopWidth: 1,
              borderTopColor: theme.secondaryBorder
            }
          ]}
        >
          {section.title.icon}
          <Text
            style={minWidthSize('xl') ? spacings.mlMi : spacings.mlTy}
            fontSize={minWidthSize('xl') ? 12 : 14}
            weight="medium"
            appearance="secondaryText"
          >
            {section.title.text}
          </Text>
        </View>
      )
    },
    [minWidthSize, theme.primaryBackground, theme.secondaryBorder]
  )

  if (
    !signAccountOpState ||
    (!hasEstimation && signAccountOpState.estimationRetryError) ||
    !payValue
  ) {
    return (
      <>
        {!estimationFailed && <EstimationSkeleton />}
        <Warnings
          hasEstimation={hasEstimation}
          slowRequest={slowRequest}
          slowPaymasterRequest={slowPaymasterRequest}
          isViewOnly={isViewOnly}
          rbfDetected={false}
          bundlerFailure={false}
        />
      </>
    )
  }

  return (
    <>
      <Warnings
        hasEstimation={hasEstimation}
        slowRequest={slowRequest}
        slowPaymasterRequest={slowPaymasterRequest}
        isViewOnly={isViewOnly}
        rbfDetected={payValue?.paidBy ? !!signAccountOpState.rbfAccountOps[payValue.paidBy] : false}
        bundlerFailure={
          !!signAccountOpState.estimation?.bundlerEstimation?.nonFatalErrors?.find(
            (err) => err.cause === '4337_ESTIMATION'
          )
        }
      />
      {isSponsored && (
        <View>
          {sponsor && (
            <View style={[flexbox.alignCenter, spacings.mbLg]}>
              {sponsor.icon && (
                <Image
                  source={{ uri: sponsor.icon }}
                  resizeMode="contain"
                  style={[
                    {
                      height: 150,
                      width: 150
                    }
                  ]}
                />
              )}
              <Text fontSize={16} color={theme.secondaryText} style={{ textAlign: 'center' }}>
                <Text weight="number_black">{sponsor.name}</Text>
                {'\n'}
                <Text>is sponsoring this transaction</Text>
              </Text>
            </View>
          )}
          <Alert
            type="success"
            size="md"
            text={t(
              'This is a sponsored transaction with no gas fees. Please review the changes on the left before signing'
            )}
            style={spacings.mbSm}
          />
        </View>
      )}
      {isGaslessTransaction && (
        <Alert
          type="success"
          size="md"
          text={t(
            'This is a gasless (meta) transaction. Please review the changes on the left before signing.'
          )}
          style={spacings.mbSm}
        />
      )}
      {!isSponsored && !isGaslessTransaction && (
        <>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.mbMi
            ]}
          >
            <Text appearance="secondaryText" fontSize={14} weight="regular">
              {t('Pay fee with')}
            </Text>
            {selectedFee && (
              <Select
                value={selectedFee}
                // @ts-ignore
                setValue={onFeeSelect}
                options={feeSpeedOptions}
                selectStyle={{ height: 32 }}
                menuOptionHeight={32}
                withSearch={false}
                containerStyle={{ ...spacings.mb0, width: 160 }}
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
              defaultFeeOption.label === NO_FEE_OPTIONS.label
            }
            defaultValue={payValue ?? undefined}
            withSearch={!!payOptionsPaidByUsOrGasTank.length || !!payOptionsPaidByEOA.length}
            stickySectionHeadersEnabled
          />
        </>
      )}
      {!isSponsored &&
        !isGaslessTransaction &&
        feeSpeeds.length > 0 &&
        !!feeTokenPriceUnavailableWarning && (
          <Alert
            size="sm"
            type="warning"
            text={feeTokenPriceUnavailableWarning.text}
            title={feeTokenPriceUnavailableWarning.title}
            style={{ ...spacings.mtSm, ...spacings.mbMd }}
          />
        )}
      {/* {!isSponsored && !isGaslessTransaction && !!selectedFee && !!payValue && (
        <AmountInfo
          label="Fee"
          amountFormatted={formatDecimals(parseFloat(selectedFee.amountFormatted))}
          symbol={payValue.token?.symbol}
        />
      )} */}
      {!isSponsored && !isGaslessTransaction && !!signAccountOpState.gasSavedUSD && (
        <AmountInfo.Wrapper style={spacings.ptSm}>
          <AmountInfo.Label appearance="primary">{t('Gas Tank saves you')}</AmountInfo.Label>
          <AmountInfo.Text appearance="primary" selectable>
            {formatDecimals(signAccountOpState.gasSavedUSD, 'price')} USD
          </AmountInfo.Text>
        </AmountInfo.Wrapper>
      )}
    </>
  )
}

export default React.memo(Estimation)
