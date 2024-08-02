import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed, SigningStatus } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import AssetIcon from '@common/assets/svg/AssetIcon'
import FeeIcon from '@common/assets/svg/FeeIcon'
import Alert from '@common/components/Alert'
import { SectionedSelect } from '@common/components/Select'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings, { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import Fee from '@web/modules/sign-account-op/components/Fee'
import Warnings from '@web/modules/sign-account-op/components/Warnings'

import AmountInfo from './components/AmountInfo'
import EstimationSkeleton from './components/EstimationSkeleton'
import EstimationWrapper from './components/EstimationWrapper'
import { NO_FEE_OPTIONS } from './consts'
import { getDefaultFeeOption, mapFeeOptions, sortFeeOptions } from './helpers'
import { Props } from './types'

const Estimation = ({
  signAccountOpState,
  disabled,
  hasEstimation,
  slowRequest,
  isViewOnly
}: Props) => {
  const estimationFailed = signAccountOpState?.status?.type === SigningStatus.EstimationError
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { minWidthSize } = useWindowSize()
  const { accountStates } = useAccountsControllerState()

  const payOptionsPaidByUsOrGasTank = useMemo(() => {
    if (!signAccountOpState?.availableFeeOptions.length || !hasEstimation || estimationFailed)
      return []

    return signAccountOpState.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy === signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState))
  }, [estimationFailed, hasEstimation, signAccountOpState])

  const payOptionsPaidByEOA = useMemo(() => {
    if (!signAccountOpState?.availableFeeOptions.length || !hasEstimation || estimationFailed)
      return []

    return signAccountOpState.availableFeeOptions
      .filter((feeOption) => feeOption.paidBy !== signAccountOpState.accountOp.accountAddr)
      .sort((a: FeePaymentOption, b: FeePaymentOption) => sortFeeOptions(a, b, signAccountOpState))
      .map((feeOption) => mapFeeOptions(feeOption, signAccountOpState))
  }, [estimationFailed, hasEstimation, signAccountOpState])

  const defaultFeeOption = useMemo(
    () => getDefaultFeeOption(payOptionsPaidByUsOrGasTank, payOptionsPaidByEOA),
    [payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank]
  )

  const [payValue, setPayValue] = useState(defaultFeeOption)
  const [initialSetupDone, setInitialSetupDone] = useState(false)
  const isFeePaidByEOA =
    payValue?.paidBy && payValue?.paidBy !== signAccountOpState?.accountOp?.accountAddr

  const setFeeOption = useCallback(
    (localPayValue: any) => {
      if (!signAccountOpState?.selectedFeeSpeed) return
      setPayValue(localPayValue)

      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          feeToken: localPayValue.token,
          paidBy: localPayValue.paidBy,
          speed: localPayValue.speedCoverage.includes(signAccountOpState.selectedFeeSpeed)
            ? signAccountOpState.selectedFeeSpeed
            : FeeSpeed.Slow
        }
      })
    },
    [dispatch, signAccountOpState?.selectedFeeSpeed]
  )

  const isSmartAccountAndNotDeployed = useMemo(() => {
    if (!isSmartAccount(signAccountOpState?.account) || !signAccountOpState?.accountOp?.accountAddr)
      return false

    const accountState =
      accountStates[signAccountOpState?.accountOp.accountAddr][
        signAccountOpState?.accountOp.networkId
      ]

    return !accountState?.isDeployed
  }, [
    accountStates,
    signAccountOpState?.account,
    signAccountOpState?.accountOp.accountAddr,
    signAccountOpState?.accountOp.networkId
  ])

  useEffect(() => {
    if (!initialSetupDone) {
      setPayValue(defaultFeeOption)
    }
  }, [defaultFeeOption, initialSetupDone, payOptionsPaidByEOA, payOptionsPaidByUsOrGasTank])

  useEffect(() => {
    if (!initialSetupDone && payValue && payValue.token && hasEstimation && !estimationFailed) {
      setInitialSetupDone(true)
      setFeeOption(payValue)
    }
  }, [initialSetupDone, payValue, setFeeOption, hasEstimation, estimationFailed])

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

  const selectedFee = useMemo(
    () => feeSpeeds.find((speed) => speed.type === signAccountOpState?.selectedFeeSpeed),
    [signAccountOpState?.selectedFeeSpeed, feeSpeeds]
  )

  const onFeeSelect = useCallback(
    (speed: FeeSpeed) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_ACCOUNT_OP_UPDATE',
        params: {
          speed
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
              backgroundColor: theme.primaryBackground
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

  if ((!hasEstimation && !estimationFailed) || !signAccountOpState) {
    return (
      <EstimationWrapper>
        <EstimationSkeleton />
        <Warnings
          hasEstimation={hasEstimation}
          estimationFailed={estimationFailed}
          slowRequest={slowRequest}
          isViewOnly={isViewOnly}
          rbfDetected={false}
          bundlerFailure={false}
        />
      </EstimationWrapper>
    )
  }

  return (
    <EstimationWrapper>
      {!!hasEstimation && !estimationFailed && (
        <>
          {isSmartAccount(signAccountOpState.account) && (
            <SectionedSelect
              setValue={setFeeOption}
              label={t('Pay fee with')}
              sections={feeOptionSelectSections}
              renderSectionHeader={renderFeeOptionSectionHeader}
              containerStyle={isFeePaidByEOA ? spacings.mbTy : spacings.mb}
              value={payValue || NO_FEE_OPTIONS}
              disabled={
                disabled ||
                ((payOptionsPaidByUsOrGasTank[0]?.value === 'no-option' ||
                  !payOptionsPaidByUsOrGasTank.length) &&
                  !payOptionsPaidByEOA.length)
              }
              defaultValue={payValue}
              withSearch={!!payOptionsPaidByUsOrGasTank.length || !!payOptionsPaidByEOA.length}
              stickySectionHeadersEnabled
            />
          )}
          {isFeePaidByEOA && (
            <Alert
              size="sm"
              text={t(
                'You’ve opt in to pay the transaction with Basic account, the signing process would require 2 signatures - one by the smart account and one by the Basic account, that would broadcast the transaction.'
              )}
              style={spacings.mbSm}
            />
          )}
          {feeSpeeds.length > 0 && (
            <View style={[spacings.mbMd]}>
              <Text fontSize={16} color={theme.secondaryText} style={spacings.mbTy}>
                {t('Transaction speed')}
              </Text>
              <View
                style={[
                  flexbox.wrap,
                  flexbox.flex1,
                  flexbox.directionRow,
                  disabled && { opacity: 0.6 },
                  minWidthSize('xxl') && { margin: -SPACING_MI }
                ]}
              >
                {feeSpeeds.map((fee) => (
                  <Fee
                    disabled={disabled || fee.disabled}
                    key={fee.amount + fee.type}
                    label={`${t(fee.type.charAt(0).toUpperCase() + fee.type.slice(1))}:`}
                    type={fee.type}
                    amountUsd={parseFloat(fee.amountUsd)}
                    onPress={onFeeSelect}
                    isSelected={signAccountOpState.selectedFeeSpeed === fee.type}
                  />
                ))}
                {/* TODO: <CustomFee onPress={() => {}} /> */}
              </View>
            </View>
          )}
          {!!selectedFee && !!payValue && (
            <AmountInfo
              label="Fee"
              amountFormatted={selectedFee.amountFormatted}
              symbol={payValue.token?.symbol}
            />
          )}
          {/* // TODO: - once we clear out the gas tank functionality, here we need to render what gas it saves */}
          {/* <View style={styles.gasTankContainer}> */}
          {/*  <Text style={styles.gasTankText}>{t('Gas Tank saves you:')}</Text> */}
          {/*  <Text style={styles.gasTankText}>$ 2.6065</Text> */}
          {/* </View> */}
        </>
      )}
      <Warnings
        hasEstimation={hasEstimation}
        estimationFailed={estimationFailed}
        slowRequest={slowRequest}
        isViewOnly={isViewOnly}
        rbfDetected={payValue ? !!signAccountOpState.rbfAccountOps[payValue.paidBy] : false}
        bundlerFailure={
          !!signAccountOpState.estimation?.nonFatalErrors?.find(
            (err) => err.cause === '4337_ESTIMATION'
          )
        }
      />
      {isSmartAccountAndNotDeployed ? (
        <Alert
          type="info"
          title={t('Note')}
          style={spacings.mtTy}
          text={t(
            'Because this is your first Ambire transaction, the fee is 32% higher than usual because we have to deploy your smart wallet. Subsequent transactions will be cheaper.'
          )}
        />
      ) : null}
    </EstimationWrapper>
  )
}

export default React.memo(Estimation)
