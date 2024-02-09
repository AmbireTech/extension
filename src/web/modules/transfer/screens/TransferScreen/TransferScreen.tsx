import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import SendIcon from '@common/assets/svg/SendIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import useAddressInput from '@common/hooks/useAddressInput'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import AddressBookSection from '@web/modules/transfer/components/AddressBookSection'
import SendForm from '@web/modules/transfer/components/SendForm/SendForm'

import styles from './styles'

const TransferScreen = () => {
  const { dispatch } = useBackgroundService()
  const { state } = useTransferControllerState()
  const { isTopUp, userRequest, isFormValid } = state
  const { accountPortfolio } = usePortfolioControllerState()
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()

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

  const sendTransaction = useCallback(async () => {
    await dispatch({
      type: 'MAIN_CONTROLLER_TRANSFER_BUILD_USER_REQUEST'
    })
  }, [dispatch])

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width={isTopUp ? 'sm' : 'lg'}
      header={<Header withAmbireLogo mode="custom-inner-content" />}
      footer={
        <>
          <BackButton onPress={onBack} />
          <Button
            type="primary"
            text={
              userRequest
                ? t(!isTopUp ? 'Sending...' : 'Topping up...')
                : t(!isTopUp ? 'Send' : 'Top Up')
            }
            onPress={sendTransaction}
            hasBottomSpacing={false}
            style={{ minWidth: 124 }}
            disabled={
              !!userRequest ||
              !isFormValid ||
              // No need for recipient address validation for top up
              (!isTopUp && addressInputState.validation.isError)
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
          <Panel style={styles.panel} title={state.isTopUp ? 'Top Up Gas Tank' : ''}>
            <View style={styles.container}>
              <View style={flexbox.flex1}>
                <SendForm
                  addressInputState={addressInputState}
                  state={state}
                  isAllReady={accountPortfolio?.isAllReady}
                />
              </View>
              {!isTopUp && (
                <>
                  <View style={styles.separator} />
                  <View style={flexbox.flex1}>
                    <AddressBookSection />
                  </View>
                </>
              )}
            </View>
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

export default TransferScreen
