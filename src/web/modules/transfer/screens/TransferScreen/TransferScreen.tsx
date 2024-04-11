import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { isSmartAccount as getIsSmartAccount } from '@ambire-common/libs/account/account'
import SendIcon from '@common/assets/svg/SendIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import useAddressInput from '@common/hooks/useAddressInput'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import SendForm from '@web/modules/transfer/components/SendForm/SendForm'

import getStyles from './styles'

const TransferScreen = () => {
  const { dispatch } = useBackgroundService()
  const { state } = useTransferControllerState()
  const { isTopUp, userRequest, isFormValid } = state
  const { accountPortfolio } = usePortfolioControllerState()
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { selectedAccount, accounts } = useMainControllerState()
  const selectedAccountData = accounts.find((account) => account.addr === selectedAccount)
  const isSmartAccount = selectedAccountData ? getIsSmartAccount(selectedAccountData) : false
  const setAddressState = useCallback(
    (newAddressState: AddressStateOptional) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      dispatch({
        type: 'MAIN_CONTROLLER_TRANSFER_UPDATE',
        params: {
          addressState: newAddressState
        }
      })
    },
    [dispatch]
  )

  const addressInputState = useAddressInput({
    addressState: state.addressState,
    setAddressState,
    overwriteError:
      state?.isInitialized && !state?.validationFormMsgs.recipientAddress.success
        ? state?.validationFormMsgs.recipientAddress.message
        : '',
    overwriteValidLabel: state?.validationFormMsgs?.recipientAddress.success
      ? state.validationFormMsgs.recipientAddress.message
      : ''
  })

  const onBack = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_TRANSFER_RESET_FORM'
    })
    navigate(ROUTES.dashboard)
  }, [navigate, dispatch])

  const sendTransaction = useCallback(() => {
    dispatch({
      type: 'MAIN_CONTROLLER_TRANSFER_BUILD_USER_REQUEST'
    })
  }, [dispatch])

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="xl"
      header={<HeaderAccountAndNetworkInfo />}
      footer={
        <>
          <BackButton onPress={onBack} />
          <Button
            testID="transfer-button-send"
            type="primary"
            text={
              userRequest
                ? t(!isTopUp ? 'Sending...' : 'Topping up...')
                : t(!isTopUp ? 'Send' : 'Top Up')
            }
            onPress={sendTransaction}
            hasBottomSpacing={false}
            size="large"
            disabled={
              !!userRequest ||
              !isFormValid ||
              // No need for recipient address validation for top up
              (!isTopUp && addressInputState.validation.isError) ||
              (isTopUp && !isSmartAccount)
            }
          >
            <View style={spacings.plTy}>
              {isTopUp ? (
                <TopUpIcon strokeWidth={1} width={24} height={24} color={theme.primaryBackground} />
              ) : (
                <SendIcon width={24} height={24} color={theme.primaryBackground} />
              )}
            </View>
          </Button>
        </>
      }
    >
      <TabLayoutWrapperMainContent>
        {state?.isInitialized ? (
          <Panel
            style={[styles.panel]}
            forceContainerSmallSpacings
            title={state.isTopUp ? 'Top Up Gas Tank' : 'Send'}
          >
            <SendForm
              addressInputState={addressInputState}
              state={state}
              isAllReady={accountPortfolio?.isAllReady}
              isSmartAccount={isSmartAccount}
            />
            {isTopUp && !isSmartAccount && (
              <View style={spacings.ptLg}>
                <Alert
                  type="warning"
                  // @TODO: replace temporary text
                  title={t(
                    'The Gas Tank is exclusively available for Smart Accounts. It enables you to pre-pay network fees using stablecoins and custom tokens.'
                  )}
                  isTypeLabelHidden
                />
              </View>
            )}
          </Panel>
        ) : (
          <View style={styles.spinnerContainer}>
            <Spinner />
          </View>
        )}
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(TransferScreen)
