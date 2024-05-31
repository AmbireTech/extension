import React, { useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { FEE_COLLECTOR } from '@ambire-common/consts/addresses'
import { AddressStateOptional } from '@ambire-common/interfaces/domains'
import { isSmartAccount as getIsSmartAccount } from '@ambire-common/libs/account/account'
import SendIcon from '@common/assets/svg/SendIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useAddressInput from '@common/hooks/useAddressInput'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { getAddressFromAddressState } from '@common/utils/domains'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import SendForm from '@web/modules/transfer/components/SendForm/SendForm'

import getStyles from './styles'

const TransferScreen = () => {
  const { dispatch } = useBackgroundService()
  const { addToast } = useToast()
  const { state, transferCtrl } = useTransferControllerState()
  const {
    isTopUp,
    validationFormMsgs,
    addressState,
    isRecipientHumanizerKnownTokenOrSmartContract,
    isSWWarningVisible,
    isRecipientAddressUnknown,
    isFormValid
  } = state
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { selectedAccount, accounts } = useMainControllerState()
  const selectedAccountData = accounts.find((account) => account.addr === selectedAccount)
  const isSmartAccount = selectedAccountData ? getIsSmartAccount(selectedAccountData) : false

  const setAddressState = useCallback(
    (newPartialAddressState: AddressStateOptional) => {
      transferCtrl.update({ addressState: newPartialAddressState })
    },
    [transferCtrl]
  )

  const addressInputState = useAddressInput({
    addressState,
    setAddressState,
    overwriteError:
      state?.isInitialized && !validationFormMsgs.recipientAddress.success
        ? validationFormMsgs.recipientAddress.message
        : '',
    overwriteValidLabel: validationFormMsgs?.recipientAddress.success
      ? validationFormMsgs.recipientAddress.message
      : ''
  })

  const onBack = useCallback(() => {
    navigate(ROUTES.dashboard)
  }, [navigate])

  const sendTransaction = useCallback(() => {
    if (!state.amount || !state.selectedToken) return

    dispatch({
      type: 'MAIN_CONTROLLER_BUILD_TRANSFER_USER_REQUEST',
      params: {
        amount: state.amount,
        selectedToken: state.selectedToken,
        recipientAddress: isTopUp ? FEE_COLLECTOR : getAddressFromAddressState(addressState)
      }
    })

    transferCtrl.resetForm()
  }, [addressState, dispatch, isTopUp, state.amount, state.selectedToken, transferCtrl])

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
            text={t(!isTopUp ? 'Send' : 'Top Up')}
            onPress={sendTransaction}
            hasBottomSpacing={false}
            size="large"
            disabled={!isFormValid || addressInputState.validation.isError}
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
              isSmartAccount={isSmartAccount}
              amountErrorMessage={validationFormMsgs.amount.message || ''}
              isRecipientAddressUnknown={isRecipientAddressUnknown}
              isRecipientHumanizerKnownTokenOrSmartContract={
                isRecipientHumanizerKnownTokenOrSmartContract
              }
              isSWWarningVisible={isSWWarningVisible}
            />
            {isTopUp && !isSmartAccount && (
              <View style={spacings.ptLg}>
                <Alert
                  type="warning"
                  title={
                    <Trans>
                      The Gas Tank is exclusively available for Smart Accounts. It lets you pre-pay
                      for network fees using stable coins and other tokens and use the funds on any
                      chain.{' '}
                      <Pressable
                        onPress={async () => {
                          try {
                            await createTab(
                              'https://help.ambire.com/hc/en-us/articles/5397969913884-What-is-the-Gas-Tank'
                            )
                          } catch {
                            addToast("Couldn't open link", { type: 'error' })
                          }
                        }}
                      >
                        <Text appearance="warningText" underline>
                          {t('Learn more')}
                        </Text>
                      </Pressable>
                      .
                    </Trans>
                  }
                  isTypeLabelHidden
                />
              </View>
            )}
          </Panel>
        ) : (
          <SkeletonLoader
            width={640}
            height={420}
            appearance="primaryBackground"
            style={{ marginLeft: 'auto', marginRight: 'auto' }}
          />
        )}
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(TransferScreen)
