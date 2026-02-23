/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Pressable, ScrollView, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import wait from '@ambire-common/utils/wait'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import AccountPersonalizeCard from '@common/modules/account-personalize/components/AccountPersonalizeCard'
import AccountsLoadingAnimation from '@common/modules/account-personalize/components/AccountsLoadingAnimation'
import AccountsLoadingDotsAnimation from '@common/modules/account-personalize/components/AccountsLoadingDotsAnimation'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { createTab } from '@web/extension-services/background/webapi/tab'
import PinExtension from '@web/modules/auth/components/PinExtension'

import getStyles from './styles'

export const CARD_WIDTH = 400

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { goToNextRoute, goToPrevRoute, setAccountsToPersonalize, accountsToPersonalize } =
    useOnboardingNavigation()
  const { theme } = useTheme(getStyles)
  const { state: accountPickerState, dispatch: accountPickerDispatch } =
    useController('AccountPickerController')
  const {
    state: { statuses, accounts },
    dispatch: accountsDispatch
  } = useController('AccountsController')
  const { isSetupComplete } = useController('WalletStateController').state
  const { addToast } = useToast()
  const initPassed = useRef(false)
  const newlyAddedAccounts = useMemo(() => accounts.filter((a) => a.newlyAdded) || [], [accounts])

  const { handleSubmit, control, setValue, getValues } = useForm({
    defaultValues: {
      accounts: accountPickerState.addedAccountsFromCurrentSession || newlyAddedAccounts
    }
  })

  // Remains in loading state until `accountsToPersonalize` are loaded
  const [isLoading, setIsLoading] = useState(true)
  // Enters into completed state after the `Complete` button is pressed
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!accountPickerState.initParams) return
    if (accountPickerState.isInitialized) return
    if (initPassed.current && !completed) return

    accountPickerDispatch({
      type: 'method',
      params: {
        method: 'init',
        args: []
      }
    })
    if (!isLoading) setIsLoading(true)
    if (completed) setCompleted(false)
    if (accountsToPersonalize.length) setAccountsToPersonalize([])
    initPassed.current = true
  }, [
    isLoading,
    accountPickerDispatch,
    accountPickerState.isInitialized,
    accountPickerState.initParams,
    completed,
    accountsToPersonalize,
    setAccountsToPersonalize
  ])

  useEffect(() => {
    if (
      !accountPickerState.initParams &&
      !accountPickerState.isInitialized &&
      accountsToPersonalize.length &&
      !newlyAddedAccounts.length &&
      !completed
    ) {
      setCompleted(true)
      initPassed.current = false
    }
  }, [
    accountPickerState.initParams,
    accountPickerState.isInitialized,
    accountsToPersonalize.length,
    completed,
    newlyAddedAccounts.length,
    goToNextRoute,
    isSetupComplete
  ])

  useEffect(() => {
    if (!isSetupComplete && !!completed) goToNextRoute()
  }, [completed, goToNextRoute, isSetupComplete])

  const accountPickerInitializedRef = useRef(accountPickerState.isInitialized)
  const accountsToPersonalizeRef = useRef(accountsToPersonalize)
  const newlyAddedAccountsRef = useRef(newlyAddedAccounts)
  const isLoadingRef = useRef(isLoading)

  useEffect(() => {
    accountPickerInitializedRef.current = accountPickerState.isInitialized
  }, [accountPickerState.isInitialized])

  useEffect(() => {
    accountsToPersonalizeRef.current = accountsToPersonalize
  }, [accountsToPersonalize])

  useEffect(() => {
    newlyAddedAccountsRef.current = newlyAddedAccounts
  }, [newlyAddedAccounts])

  useEffect(() => {
    isLoadingRef.current = isLoading
  }, [isLoading])

  useEffect(() => {
    // We reference the latest values via refs. Accessing state directly inside this
    // async effect could read outdated values, since state updates are not guaranteed
    // to sync during the async wait loops.
    const getShouldStopLoadingBasedOnLatestState = () =>
      !!accountPickerInitializedRef.current ||
      (accountsToPersonalizeRef.current && accountsToPersonalizeRef.current.length > 0) ||
      (newlyAddedAccountsRef.current && newlyAddedAccountsRef.current.length > 0)

    // We reference the latest values via refs. Accessing state directly inside this
    // async effect could read outdated values, since state updates are not guaranteed
    // to sync during the async wait loops.
    const getShouldComplete = () =>
      !accountPickerInitializedRef.current &&
      (accountsToPersonalizeRef.current?.length ?? 0) === 0 &&
      (newlyAddedAccountsRef.current?.length ?? 0) === 0

    let resolved = false

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    ;(async () => {
      // initial UX delay
      await wait(1100)
      if (resolved) return

      if (getShouldStopLoadingBasedOnLatestState()) {
        if (!resolved) setIsLoading(false)
        return
      }

      const timeoutMs = 3000 // Poll for up to 3s to allow controller updates to arrive.
      const intervalMs = 200 // Poll interval
      const start = Date.now()

      while (Date.now() - start < timeoutMs && !resolved) {
        // eslint-disable-next-line no-await-in-loop
        await wait(intervalMs)
        if (resolved) return
        if (getShouldStopLoadingBasedOnLatestState()) {
          if (!resolved) setIsLoading(false)
          return
        }
      }

      if (resolved) return
      if (!isLoadingRef.current) return

      setIsLoading(false)
      if (getShouldComplete()) setCompleted(true)
    })()

    return () => {
      resolved = true
    }
  }, [isLoading])

  // the hook inits the list with accountsToPersonalize
  useEffect(() => {
    if (isLoading || accountsToPersonalize.length) return

    let state: Account[] = []
    if (accountPickerState.isInitialized) {
      state = accountPickerState.addedAccountsFromCurrentSession
    }

    if (!accountPickerState.isInitialized && newlyAddedAccounts.length) {
      state = newlyAddedAccounts
    }

    if (state.length) {
      setAccountsToPersonalize(state)
    } else {
      goToNextRoute()
    }
  }, [
    isLoading,
    accountPickerState.isInitialized,
    accountPickerState.addedAccountsFromCurrentSession,
    accountsToPersonalize.length,
    newlyAddedAccounts,
    statuses.addAccounts,
    setAccountsToPersonalize,
    goToNextRoute
  ])

  // prevents showing accounts to personalize from prev sessions
  useEffect(() => {
    if (newlyAddedAccounts.length && accountPickerState.isInitialized) {
      accountsDispatch({
        type: 'method',
        params: {
          method: 'resetAccountsNewlyAddedState',
          args: []
        }
      })
    }
  }, [newlyAddedAccounts.length, accountPickerState.isInitialized, accountsDispatch])

  useEffect(() => {
    setValue('accounts', accountsToPersonalize)
  }, [accountsToPersonalize, setValue])

  const { fields } = useFieldArray({ control, name: 'accounts' })

  const handleSave = useCallback(
    (data?: { accounts: Account[] }) => {
      const newAccounts = data?.accounts || getValues('accounts')
      accountsDispatch({
        type: 'method',
        params: {
          method: 'updateAccountPreferences',
          args: [newAccounts.map((a) => ({ addr: a.addr, preferences: a.preferences }))]
        }
      })
    },
    [accountsDispatch, getValues]
  )

  useEffect(() => {
    const handleBeforeUnload = () => handleSave()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [handleSave])

  const handleComplete = useCallback(async () => {
    await handleSubmit(handleSave)()
    accountsDispatch({
      type: 'method',
      params: {
        method: 'resetAccountsNewlyAddedState',
        args: []
      }
    })
    if (isSetupComplete) {
      initPassed.current = false
      accountPickerDispatch({
        type: 'method',
        params: {
          method: 'reset',
          args: []
        }
      })
    } else {
      setCompleted(true)
    }
  }, [isSetupComplete, accountsDispatch, accountPickerDispatch, handleSave, handleSubmit])

  const handleContactSupport = useCallback(async () => {
    try {
      await createTab('https://help.ambire.com/hc/en-us/requests/new')
    } catch {
      addToast("Couldn't open link", { type: 'error' })
    }
  }, [addToast])

  return (
    <>
      {!!completed && !isLoading && <PinExtension />}
      <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
        <TabLayoutWrapperMainContent>
          <Panel
            type="onboarding"
            spacingsSize="small"
            style={!accountPickerState.pageError && spacings.ptMd}
            withBackButton={!!accountPickerState.pageError}
            onBackButtonPress={() => {
              goToPrevRoute()
            }}
            title={accountPickerState.pageError ? t('Accounts') : undefined}
          >
            {isLoading && !accountPickerState.pageError ? (
              <View style={[flexbox.alignCenter]}>
                <View style={spacings.mbXl}>
                  <AccountsLoadingAnimation />
                </View>
                <Text fontSize={20} weight="semiBold" style={[text.center, spacings.mbSm]}>
                  {t('Loading accounts')}
                </Text>
                <AccountsLoadingDotsAnimation />
              </View>
            ) : accountPickerState.pageError ? (
              <View style={flexbox.alignCenter}>
                <Alert
                  type="warning"
                  title={accountPickerState.pageError}
                  text={
                    <Trans>
                      <Alert.Text type="warning">
                        Please go back and start the account-adding process again. If the problem
                        persists, please{' '}
                        <Pressable onPress={handleContactSupport}>
                          <Alert.Text type="warning" style={text.underline}>
                            contact our support team
                          </Alert.Text>
                        </Pressable>
                        .
                      </Alert.Text>
                    </Trans>
                  }
                />
              </View>
            ) : (
              <>
                <SuccessAnimation
                  style={{ ...spacings.mb2Xl, ...flexbox.alignSelfCenter, ...spacings.mt }}
                />
                <Text
                  testID="added-successfully-text"
                  weight="medium"
                  fontSize={20}
                  style={{ alignSelf: 'center', ...spacings.mbXl }}
                >
                  {accountsToPersonalize.length
                    ? t('Added successfully')
                    : t('No new accounts added')}
                </Text>
                <ScrollView style={spacings.mbLg}>
                  {accountsToPersonalize.map((acc, index) => (
                    <AccountPersonalizeCard
                      key={acc.addr + completed}
                      control={control}
                      index={index}
                      account={acc}
                      hasBottomSpacing={index !== fields.length - 1}
                      onSave={handleSave as any}
                      disableEdit={!!completed}
                    />
                  ))}
                </ScrollView>
                {completed ? (
                  <Text appearance="secondaryText" weight="medium" style={[text.center]}>
                    {t('You can access your accounts from the dashboard via the extension icon.')}
                  </Text>
                ) : (
                  <Button
                    testID="button-save-and-continue"
                    size="large"
                    onPress={handleComplete}
                    hasBottomSpacing={false}
                    text={t('Complete')}
                    disabled={!accounts.length}
                  />
                )}
                {!completed && ['seed', 'hw'].includes(accountPickerState.subType as any) && (
                  <Button
                    testID="add-more-accounts-btn"
                    type="outline"
                    text={t('Add more accounts from this {{source}}', {
                      source:
                        accountPickerState.subType === 'hw' ? 'hardware wallet' : 'recovery phrase'
                    })}
                    onPress={() => {
                      handleSave()
                      goToNextRoute(WEB_ROUTES.accountPicker)
                    }}
                    style={{
                      ...spacings.phMi,
                      ...spacings.mtSm,
                      height: 40
                    }}
                    size="tiny"
                    hasBottomSpacing={false}
                    childrenPosition="left"
                  >
                    <AddCircularIcon
                      width={20}
                      height={20}
                      color={theme.primaryText}
                      style={spacings.mrMi}
                    />
                  </Button>
                )}
              </>
            )}
          </Panel>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </>
  )
}

export default React.memo(AccountPersonalizeScreen)
