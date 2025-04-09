import { formatUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable, View } from 'react-native'

import { EstimationStatus } from '@ambire-common/controllers/estimation/types'
import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import FlipIcon from '@common/assets/svg/FlipIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import WalletFilledIcon from '@common/assets/svg/WalletFilledIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import NumberInput from '@common/components/NumberInput'
import Select from '@common/components/Select'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Header from '@common/modules/header/components/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import ActiveRouteCard from '@web/modules/swap-and-bridge/components/ActiveRouteCard'
import SwapAndBridgeEstimation from '@web/modules/swap-and-bridge/components/Estimation'
import MaxAmount from '@web/modules/swap-and-bridge/components/MaxAmount'
import RoutesModal from '@web/modules/swap-and-bridge/components/RoutesModal'
import SwitchTokensButton from '@web/modules/swap-and-bridge/components/SwitchTokensButton'
import ToTokenSelect from '@web/modules/swap-and-bridge/components/ToTokenSelect'
import useSwapAndBridgeForm from '@web/modules/swap-and-bridge/hooks/useSwapAndBridgeForm'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const SWAP_AND_BRIDGE_HC_URL = 'https://help.ambire.com/hc/en-us/articles/16748050198428'

const { isPopup } = getUiType()

const SwapAndBridgeScreen = () => {
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { maxWidthSize } = useWindowSize()
  const {
    sessionId,
    fromAmountValue,
    onFromAmountChange,
    fromTokenOptions,
    fromTokenValue,
    fromTokenAmountSelectDisabled,
    handleChangeFromToken,
    toNetworksOptions,
    getToNetworkSelectValue,
    handleSetToNetworkValue,
    toTokenOptions,
    toTokenValue,
    toTokenAmountSelectDisabled,
    handleAddToTokenByAddress,
    handleChangeToToken,
    handleSwitchFromAmountFieldMode,
    handleSetMaxFromAmount,
    handleSubmitForm,
    formattedToAmount,
    shouldConfirmFollowUpTransactions,
    followUpTransactionConfirmed,
    setFollowUpTransactionConfirmed,
    highPriceImpactInPercentage,
    highPriceImpactConfirmed,
    setHighPriceImpactConfirmed,
    handleSwitchFromAndToTokens,
    pendingRoutes,
    routesModalRef,
    openRoutesModal,
    closeRoutesModal,
    estimationModalRef,
    closeEstimationModal,
    isAutoSelectRouteDisabled,
    setIsAutoSelectRouteDisabled,
    isOneClickModeAllowed
  } = useSwapAndBridgeForm()
  const {
    sessionIds,
    fromSelectedToken,
    fromAmount,
    fromAmountInFiat,
    fromAmountFieldMode,
    maxFromAmount,
    quote,
    toChainId,
    formStatus,
    validateFromAmount,
    isSwitchFromAndToTokensEnabled,
    isHealthy,
    shouldEnableRoutesSelection,
    updateQuoteStatus,
    statuses: swapAndBridgeCtrlStatuses,
    signAccountOpController
  } = useSwapAndBridgeControllerState()
  const { statuses: mainCtrlStatuses } = useMainControllerState()
  const { portfolio } = useSelectedAccountControllerState()
  const prevPendingRoutes: any[] | undefined = usePrevious(pendingRoutes)
  const scrollViewRef: any = useRef(null)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    if (formStatus === SwapAndBridgeFormStatus.ReadyToEstimate && !signAccountOpController) {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_INIT_SIGN_ACCOUNT_OP'
      })
    }
  }, [formStatus, dispatch, signAccountOpController])

  useEffect(() => {
    if (!signAccountOpController || isAutoSelectRouteDisabled) return
    if (signAccountOpController.estimation.status === EstimationStatus.Error) {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_ON_ESTIMATION_FAILURE'
      })
    }
  })

  const handleBackButtonPress = useCallback(() => {
    navigate(ROUTES.dashboard)
  }, [navigate])

  useEffect(() => {
    if (!pendingRoutes || !prevPendingRoutes) return
    if (!pendingRoutes.length) return
    if (prevPendingRoutes.length < pendingRoutes.length) {
      // scroll to top when there is a new item in the active routes list
      scrollViewRef.current?.scrollTo({ y: 0 })
    }
  }, [pendingRoutes, prevPendingRoutes])

  // TODO: Disable tokens that are NOT supported
  // (not in the `fromTokenList` of the SwapAndBridge controller)

  // TODO: Confirmation modal (warn) if the diff in dollar amount between the
  // FROM and TO tokens is too high (therefore, user will lose money).

  const paddingHorizontalStyle = useMemo(() => getTabLayoutPadding(maxWidthSize), [maxWidthSize])

  const dollarIcon = useCallback(() => {
    if (fromAmountFieldMode === 'token') return null

    return (
      <Text
        fontSize={20}
        weight="medium"
        style={{ marginBottom: 3 }}
        appearance={fromAmountInFiat ? 'primaryText' : 'secondaryText'}
      >
        $
      </Text>
    )
  }, [fromAmountFieldMode, fromAmountInFiat])

  const handleFollowUpTransactionConfirmedCheckboxPress = useCallback(() => {
    setFollowUpTransactionConfirmed((p) => !p)
  }, [setFollowUpTransactionConfirmed])

  const isEstimatingRoute =
    formStatus === SwapAndBridgeFormStatus.ReadyToEstimate &&
    (!signAccountOpController ||
      signAccountOpController.estimation.status === EstimationStatus.Loading)

  const isNotReadyToProceed = useMemo(() => {
    return (
      (formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit &&
        formStatus !== SwapAndBridgeFormStatus.ReadyToEstimate) ||
      shouldConfirmFollowUpTransactions !== followUpTransactionConfirmed ||
      (!!highPriceImpactInPercentage && !highPriceImpactConfirmed) ||
      mainCtrlStatuses.buildSwapAndBridgeUserRequest !== 'INITIAL' ||
      updateQuoteStatus === 'LOADING' ||
      isEstimatingRoute
    )
  }, [
    followUpTransactionConfirmed,
    isEstimatingRoute,
    formStatus,
    highPriceImpactInPercentage,
    highPriceImpactConfirmed,
    mainCtrlStatuses.buildSwapAndBridgeUserRequest,
    shouldConfirmFollowUpTransactions,
    updateQuoteStatus
  ])

  const toTokenInPortfolio = useMemo(() => {
    const [address] = toTokenValue.value.split('.')

    if (!address || !toChainId) return null

    const bigintChainId = BigInt(toChainId)

    const tokenInPortfolio = portfolio?.tokens.find(
      (token) =>
        token.address === address &&
        token.chainId === bigintChainId &&
        !token.flags.onGasTank &&
        !token.flags.rewardsType
    )

    if (!tokenInPortfolio) return null

    const amountFormatted = formatDecimals(
      parseFloat(formatUnits(tokenInPortfolio.amount, tokenInPortfolio.decimals)),
      'amount'
    )

    return {
      ...tokenInPortfolio,
      amountFormatted
    }
  }, [portfolio?.tokens, toChainId, toTokenValue.value])

  const handleHighPriceImpactCheckboxPress = useCallback(() => {
    setHighPriceImpactConfirmed((p) => !p)
  }, [setHighPriceImpactConfirmed])

  const handleOpenReadMore = useCallback(() => Linking.openURL(SWAP_AND_BRIDGE_HC_URL), [])

  if (!sessionIds.includes(sessionId)) return null

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      // header={<HeaderAccountAndNetworkInfo withOG />}
      header={
        <Header
          displayBackButtonIn="popup"
          mode="title"
          customTitle={t('Swap & Bridge')}
          withAmbireLogo
        />
      }
      withHorizontalPadding={false}
      footer={!isPopup ? <BackButton onPress={handleBackButtonPress} /> : null}
    >
      <TabLayoutWrapperMainContent
        contentContainerStyle={{
          ...spacings.pt0,
          ...spacings.pb0,
          ...paddingHorizontalStyle,
          flexGrow: 1
        }}
        wrapperRef={scrollViewRef}
      >
        <View style={styles.container}>
          {isHealthy === false && (
            <Alert
              type="error"
              title={t('Temporarily unavailable.')}
              text={t(
                "We're currently unable to initiate a swap or bridge request because our service provider's API is temporarily unavailable. Please try again later. If the issue persists, check for updates or contact support."
              )}
              style={spacings.mb}
            />
          )}
          {!!pendingRoutes.length && (
            <View style={spacings.mbLg}>
              {pendingRoutes.map((activeRoute) => (
                <ActiveRouteCard key={activeRoute.activeRouteId} activeRoute={activeRoute} />
              ))}
            </View>
          )}

          <View
            style={[
              spacings.ph,
              spacings.pb,
              spacings.ptMd,
              spacings.mbMd,
              {
                borderRadius: 12,
                backgroundColor: theme.primaryBackground,
                shadowColor: theme.primaryBorder,
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.3,
                shadowRadius: 24,
                elevation: 10
              }
            ]}
          >
            <View style={spacings.mbXl}>
              <Text appearance="secondaryText" fontSize={16} weight="medium" style={spacings.mbTy}>
                {t('Send')}
              </Text>
              <View
                style={[
                  styles.secondaryContainer,
                  spacings.pr2Xl,
                  !!validateFromAmount.message && styles.secondaryContainerWarning
                ]}
              >
                <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
                  <Select
                    setValue={handleChangeFromToken}
                    options={fromTokenOptions}
                    value={fromTokenValue}
                    testID="from-token-select"
                    searchPlaceholder={t('Token name or address...')}
                    emptyListPlaceholderText={t('No tokens found.')}
                    containerStyle={{ ...flexbox.flex1, ...spacings.mb0 }}
                    // menuLeftHorizontalOffset={285}
                    selectStyle={{
                      backgroundColor: '#54597A14',
                      borderWidth: 0
                    }}
                  />
                  <NumberInput
                    value={fromAmountValue}
                    onChangeText={onFromAmountChange}
                    placeholder="0"
                    borderless
                    inputWrapperStyle={{ backgroundColor: 'transparent' }}
                    nativeInputStyle={{
                      fontFamily: FONT_FAMILIES.MEDIUM,
                      fontSize: 20,
                      textAlign: 'right'
                    }}
                    disabled={fromTokenAmountSelectDisabled}
                    containerStyle={[spacings.mb0, flexbox.flex1]}
                    leftIcon={dollarIcon}
                    leftIconStyle={spacings.plXl}
                    inputStyle={spacings.ph0}
                    error={validateFromAmount.message || ''}
                    errorType="warning"
                    testID="from-amount-input-sab"
                  />
                </View>
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifySpaceBetween,
                    spacings.ptSm
                  ]}
                >
                  {!fromTokenAmountSelectDisabled && (
                    <MaxAmount
                      isLoading={!portfolio?.isReadyToVisualize}
                      maxAmount={Number(maxFromAmount)}
                      selectedTokenSymbol={fromSelectedToken?.symbol || ''}
                      onMaxButtonPress={handleSetMaxFromAmount}
                    />
                  )}
                  {fromSelectedToken?.priceIn.length !== 0 ? (
                    <>
                      <Pressable
                        onPress={handleSwitchFromAmountFieldMode}
                        style={[
                          flexbox.directionRow,
                          flexbox.alignCenter,
                          flexbox.alignSelfStart,
                          {
                            position: 'absolute',
                            right: -32,
                            top: -8
                          }
                        ]}
                        disabled={fromTokenAmountSelectDisabled}
                      >
                        {({ hovered }: any) => (
                          <View
                            style={{
                              backgroundColor: hovered ? '#6000FF14' : theme.infoBackground,
                              borderRadius: 50,
                              paddingHorizontal: 5,
                              paddingVertical: 5,
                              ...spacings.mrTy
                            }}
                          >
                            <FlipIcon width={11} height={11} color={theme.primary} />
                          </View>
                        )}
                      </Pressable>
                      <Text
                        fontSize={12}
                        appearance="primary"
                        weight="medium"
                        testID="switch-currency-sab"
                      >
                        {fromAmountFieldMode === 'token'
                          ? `${
                              fromAmountInFiat
                                ? formatDecimals(parseFloat(fromAmountInFiat), 'value')
                                : 0
                            }`
                          : `${fromAmount ? formatDecimals(parseFloat(fromAmount), 'amount') : 0} ${
                              fromSelectedToken?.symbol
                            }`}
                      </Text>
                    </>
                  ) : (
                    <View />
                  )}
                </View>
              </View>
            </View>
            <View>
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifySpaceBetween,
                  spacings.mbTy
                ]}
              >
                <SwitchTokensButton
                  onPress={handleSwitchFromAndToTokens}
                  disabled={!isSwitchFromAndToTokensEnabled}
                />
                <Text appearance="secondaryText" fontSize={16} weight="medium">
                  {t('Receive')}
                </Text>
                <Select
                  setValue={handleSetToNetworkValue}
                  containerStyle={{ ...spacings.mb0, width: 142 }}
                  options={toNetworksOptions}
                  size="sm"
                  value={getToNetworkSelectValue}
                  selectStyle={{
                    backgroundColor: '#54597A14',
                    borderWidth: 0
                  }}
                />
              </View>
              <View style={[styles.secondaryContainer, spacings.ph0]}>
                <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.phSm]}>
                  <ToTokenSelect
                    toTokenOptions={toTokenOptions}
                    toTokenValue={toTokenValue}
                    handleChangeToToken={handleChangeToToken}
                    toTokenAmountSelectDisabled={toTokenAmountSelectDisabled}
                    addToTokenByAddressStatus={swapAndBridgeCtrlStatuses.addToTokenByAddress}
                    handleAddToTokenByAddress={handleAddToTokenByAddress}
                  />
                  <View style={[flexbox.flex1]}>
                    {!isEstimatingRoute ? (
                      <Text
                        fontSize={20}
                        weight="medium"
                        numberOfLines={1}
                        appearance={
                          formattedToAmount && formattedToAmount !== '0'
                            ? 'primaryText'
                            : 'secondaryText'
                        }
                        style={{ ...spacings.mr, textAlign: 'right' }}
                      >
                        {formattedToAmount}
                        {!!formattedToAmount &&
                          formattedToAmount !== '0' &&
                          !!quote?.selectedRoute && (
                            <Text fontSize={20} appearance="secondaryText">{` (${formatDecimals(
                              quote.selectedRoute.outputValueInUsd,
                              'price'
                            )})`}</Text>
                          )}
                      </Text>
                    ) : (
                      <SkeletonLoader
                        appearance="tertiaryBackground"
                        width={100}
                        height={32}
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </View>
                </View>
                {toTokenInPortfolio && (
                  <View
                    style={[flexbox.directionRow, spacings.ptSm, spacings.pl, flexbox.alignCenter]}
                  >
                    <WalletFilledIcon width={14} height={14} color={theme.tertiaryText} />
                    <Text
                      testID="max-available-amount"
                      numberOfLines={1}
                      fontSize={12}
                      style={spacings.mlMi}
                      weight="medium"
                      appearance="tertiaryText"
                      ellipsizeMode="tail"
                    >
                      {toTokenInPortfolio?.amountFormatted} {toTokenInPortfolio?.symbol}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {!!highPriceImpactInPercentage && (
              <View style={spacings.mbTy} testID="high-price-impact-sab">
                <Alert type="error" withIcon={false}>
                  <Checkbox
                    value={highPriceImpactConfirmed}
                    style={{ ...spacings.mb0 }}
                    onValueChange={handleHighPriceImpactCheckboxPress}
                    uncheckedBorderColor={theme.errorDecorative}
                    checkedColor={theme.errorDecorative}
                  >
                    <Text
                      fontSize={16}
                      appearance="errorText"
                      weight="medium"
                      onPress={handleHighPriceImpactCheckboxPress}
                    >
                      {t('Warning: ')}
                      <Text
                        fontSize={16}
                        appearance="errorText"
                        onPress={handleHighPriceImpactCheckboxPress}
                      >
                        {t(
                          'The price impact is too high (-{{highPriceImpactInPercentage}}%). If you continue with this trade, you will lose a significant portion of your funds. Please tick the box to acknowledge that you have read and understood this warning.',
                          {
                            highPriceImpactInPercentage: highPriceImpactInPercentage.toFixed(1)
                          }
                        )}
                      </Text>
                    </Text>
                  </Checkbox>
                </Alert>
              </View>
            )}
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
            {[
              SwapAndBridgeFormStatus.FetchingRoutes,
              SwapAndBridgeFormStatus.NoRoutesFound,
              SwapAndBridgeFormStatus.InvalidRouteSelected,
              SwapAndBridgeFormStatus.ReadyToEstimate,
              SwapAndBridgeFormStatus.ReadyToSubmit
            ].includes(formStatus) &&
              signAccountOpController?.estimation &&
              !isEstimatingRoute && (
                <View
                  style={[
                    spacings.mbLg,
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifySpaceBetween,
                    flexbox.flex1
                  ]}
                >
                  {formStatus === SwapAndBridgeFormStatus.NoRoutesFound ? (
                    <View>
                      <WarningIcon width={14} height={14} color={theme.warningDecorative} />
                      <Text fontSize={14} weight="medium" appearance="warningText">
                        {t('No routes found.')}
                      </Text>
                    </View>
                  ) : (
                    <View />
                  )}

                  <Pressable
                    style={{
                      ...styles.selectAnotherRouteButton,
                      opacity: shouldEnableRoutesSelection ? 1 : 0.5
                    }}
                    onPress={openRoutesModal as any}
                    disabled={!shouldEnableRoutesSelection}
                  >
                    <Text
                      fontSize={14}
                      weight="medium"
                      appearance="primary"
                      style={{
                        ...spacings.mr,
                        textDecorationColor: theme.primary,
                        textDecorationLine: 'underline'
                      }}
                    >
                      {t('Select route')}
                    </Text>
                    <RightArrowIcon weight="2" width={5} height={16} color={theme.primary} />
                  </Pressable>
                </View>
              )}

            {(formStatus === SwapAndBridgeFormStatus.ReadyToSubmit ||
              formStatus === SwapAndBridgeFormStatus.ReadyToEstimate ||
              formStatus === SwapAndBridgeFormStatus.InvalidRouteSelected) &&
              shouldConfirmFollowUpTransactions && (
                <View style={spacings.mb}>
                  <Checkbox
                    value={followUpTransactionConfirmed}
                    style={{ ...spacings.mb0, ...flexbox.alignCenter }}
                    onValueChange={handleFollowUpTransactionConfirmedCheckboxPress}
                  >
                    <Text fontSize={12}>
                      <Text
                        fontSize={12}
                        weight="medium"
                        onPress={handleFollowUpTransactionConfirmedCheckboxPress}
                        testID="confirm-follow-up-txns-checkbox"
                        color={
                          followUpTransactionConfirmed ? theme.primaryText : theme.warningDecorative
                        }
                        style={[
                          styles.followUpTxnText,
                          !followUpTransactionConfirmed && {
                            backgroundColor: theme.warningBackground
                          }
                        ]}
                      >
                        {t('I understand that I need to do a follow-up transaction.')}
                      </Text>{' '}
                      <Text fontSize={12} underline weight="medium" onPress={handleOpenReadMore}>
                        {t('Read more.')}
                      </Text>
                    </Text>
                  </Checkbox>
                </View>
              )}
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd]}>
            <Button
              hasBottomSpacing={false}
              text={t('Start a Batch')}
              disabled={isNotReadyToProceed}
              type="secondary"
              style={{ minWidth: 160 }}
              onPress={() => handleSubmitForm(false)}
            />
            <Button
              text={
                mainCtrlStatuses.buildSwapAndBridgeUserRequest !== 'INITIAL' || isEstimatingRoute
                  ? t('Loading...') // prev Building Transaction
                  : highPriceImpactInPercentage
                  ? t('Proceed anyway')
                  : t('Proceed') // prev Proceed
              }
              disabled={isNotReadyToProceed || !isOneClickModeAllowed}
              style={{ minWidth: 160, ...spacings.mlLg }}
              hasBottomSpacing={false}
              type={highPriceImpactInPercentage ? 'error' : 'primary'}
              onPress={() => handleSubmitForm(true)}
            />
          </View>
        </View>
      </TabLayoutWrapperMainContent>
      <RoutesModal
        sheetRef={routesModalRef}
        closeBottomSheet={closeRoutesModal}
        setIsAutoSelectRouteDisabled={(disabled: boolean) => setIsAutoSelectRouteDisabled(disabled)}
      />
      <SwapAndBridgeEstimation
        closeEstimationModal={closeEstimationModal}
        estimationModalRef={estimationModalRef}
      />
    </TabLayoutContainer>
  )
}

export default React.memo(SwapAndBridgeScreen)
