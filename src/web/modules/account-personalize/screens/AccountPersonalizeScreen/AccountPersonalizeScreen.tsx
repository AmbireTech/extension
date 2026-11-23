import React, { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'

import { isExtensionOverlayView } from '@ambire-common/interfaces/ui'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import EditAccountIcon from '@common/assets/svg/EditAccountIcon'
import RemoveAccountIcon from '@common/assets/svg/RemoveAccountIcon'
import Button from '@common/components/Button'
import DotsLoadingAnimation from '@common/components/DotsLoadingAnimation'
import Panel from '@common/components/Panel'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { selectIsPinned } from '@common/controllers/wallet-state/selectors'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import AccountPersonalizeCard from '@common/modules/account-personalize/components/AccountPersonalizeCard'
import AccountsLoadingAnimation from '@common/modules/account-personalize/components/AccountsLoadingAnimation'
import AccountsSectionTitle from '@common/modules/account-personalize/components/AccountsSectionTitle'
import AccountsToRemoveSection from '@common/modules/account-personalize/components/AccountsToRemoveSection'
import PersonalizeAccountsList from '@common/modules/account-personalize/components/PersonalizeAccountsList'
import PrivacyPoolsAccountPersonalizeCard from '@common/modules/account-personalize/components/PrivacyPoolsAccountPersonalizeCard'
import useAccountPersonalize from '@common/modules/account-personalize/hooks/useAccountPersonalize'
import SafeCreateSummary from '@common/modules/auth/components/SafeCreateSummary'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { FORWARD_NAVIGATION_STATE, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import PinExtension from '@web/modules/auth/components/PinExtension'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

export const CARD_WIDTH = 400

// As tall as the header's back button (28), also while the button is hidden
const HEADER_STYLE = { minHeight: 28 }
// Renders nothing unless the account being named is the Safe from Safe create
const SAFE_CREATE_SUMMARY = <SafeCreateSummary />

const selectIsWalletOpen = (state: AllControllersMappingType['UiController']) =>
  state.views.some(isExtensionOverlayView)

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { theme } = useTheme(getStyles)
  const {
    control,
    fields,
    updatingKeysAddrs,
    alreadyAddedAddrs,
    isLoading,
    hasBackButton,
    isAdding,
    addedAccounts,
    accountsToRemove,
    removedAccounts,
    isRemovalOnly,
    canProceed,
    handleSaveAccountName,
    handleProceed,
    privacyPoolsAccount,
    addedPrivacyPoolsAccount,
    handleSavePrivacyPoolsAccountName,
    title,
    proceedText,
    removalOnlyText,
    removalNote,
    noAccountsText,
    addMoreText
  } = useAccountPersonalize()
  const { state: isPinned } = useController('WalletStateController', selectIsPinned)
  const { state: isWalletOpen } = useController('UiController', selectIsWalletOpen)
  // What the tab added: its accounts, or its Privacy Pools account
  const added = addedAccounts || addedPrivacyPoolsAccount
  // Once added, the wallet opens on its own (see `openWallet`). Kept for these accounts after it
  // closes again, and not for the next ones the tab adds.
  const [walletOpenedFor, setWalletOpenedFor] = useState<typeof added>(null)
  if (added && isWalletOpen && walletOpenedFor !== added) setWalletOpenedFor(added)
  const hasWalletOpened = !!added && walletOpenedFor === added
  // Listed apart like on the personalize step, each keeping the index of its field
  const addedGroups = useMemo(() => {
    const items = (addedAccounts || []).map((account, index) => ({ account, index }))
    const isInWallet = (addr: string) =>
      updatingKeysAddrs.includes(addr) || alreadyAddedAddrs.includes(addr)

    return [
      {
        key: 'added',
        title: t('Added'),
        items: items.filter(({ account }) => !isInWallet(account.addr))
      },
      {
        key: 'keysUpdated',
        title: t('Keys updated'),
        items: items.filter(({ account }) => updatingKeysAddrs.includes(account.addr))
      },
      {
        key: 'alreadyAdded',
        title: t('Already added'),
        items: items.filter(({ account }) => alreadyAddedAddrs.includes(account.addr))
      }
    ].filter(({ items: groupItems }) => groupItems.length)
  }, [addedAccounts, updatingKeysAddrs, alreadyAddedAddrs, t])
  // Nothing new came, the accounts the wallet has got new keys or were only named again
  const hasNoNewAccounts = !addedGroups.some(({ key }) => key === 'added')
  const hasMultipleGroups = addedGroups.length + (removedAccounts.length ? 1 : 0) > 1

  const listEmpty = useMemo(
    () => (
      <Text appearance="secondaryText" weight="medium" style={text.center}>
        {noAccountsText}
      </Text>
    ),
    [noAccountsText]
  )

  // Added, and the flow went on in the popup - this tab stays up to show them
  if (added) {
    return (
      <>
        {/* Pinned, it only says to open the wallet, which has opened already */}
        {!(isPinned && hasWalletOpened) && <PinExtension />}
        <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
          <TabLayoutWrapperMainContent>
            <Panel type="onboarding" spacingsSize="small" style={spacings.ptMd}>
              <SuccessAnimation
                style={{ ...spacings.mb2Xl, ...flexbox.alignSelfCenter, ...spacings.mt }}
              />
              <Text
                testID="added-successfully-text"
                weight="medium"
                fontSize={20}
                style={{ alignSelf: 'center', ...spacings.mbXl }}
              >
                {removedAccounts.length || (!!addedAccounts?.length && hasNoNewAccounts)
                  ? t('Accounts updated')
                  : t('Added successfully')}
              </Text>
              <ScrollView style={spacings.mbLg}>
                {!!addedPrivacyPoolsAccount && !!privacyPoolsAccount && (
                  <PrivacyPoolsAccountPersonalizeCard
                    name={privacyPoolsAccount.name}
                    sourceText={privacyPoolsAccount.sourceText}
                    disableEdit
                    onSaveName={handleSavePrivacyPoolsAccountName}
                  />
                )}
                {addedGroups.map(({ key, title, items }, groupIndex) => (
                  <React.Fragment key={key}>
                    {hasMultipleGroups && (
                      <AccountsSectionTitle
                        title={title}
                        count={items.length}
                        style={groupIndex ? spacings.mtXl : undefined}
                      />
                    )}
                    {items.map(({ account, index }, i) => (
                      <AccountPersonalizeCard
                        key={account.addr}
                        control={control}
                        index={index}
                        account={account}
                        hasBottomSpacing={i !== items.length - 1}
                        disableEdit
                        onSaveName={handleSaveAccountName}
                      />
                    ))}
                  </React.Fragment>
                ))}
                {!!removedAccounts.length && (
                  <View style={!!addedAccounts?.length && spacings.mtXl}>
                    <AccountsToRemoveSection
                      accounts={removedAccounts}
                      title={t('Removed')}
                      withBadge={false}
                    />
                  </View>
                )}
              </ScrollView>
              <Text appearance="secondaryText" weight="medium" style={text.center}>
                {t('You can access your accounts from the dashboard via the extension icon.')}
              </Text>
            </Panel>
          </TabLayoutWrapperMainContent>
        </TabLayoutContainer>
      </>
    )
  }

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          // The header stays, as tall as with the back button, so nothing moves once it shows up
          withBackButton={hasBackButton}
          titleContainerStyle={HEADER_STYLE}
          onBackButtonPress={goToPrevRoute}
          title={title}
        >
          {isLoading ? (
            <View style={flexbox.alignCenter}>
              <View style={spacings.mbXl}>
                <AccountsLoadingAnimation />
              </View>
              <Text fontSize={20} weight="semiBold" style={[text.center, spacings.mbSm]}>
                {t('Loading accounts')}
              </Text>
              <DotsLoadingAnimation />
            </View>
          ) : (
            <>
              <View
                testID="personalize-accounts-header"
                style={[flexbox.alignCenter, spacings.mbXl]}
              >
                {isRemovalOnly ? <RemoveAccountIcon /> : <EditAccountIcon />}
              </View>
              {!!removalOnlyText && (
                <Text appearance="secondaryText" style={[text.center, spacings.mbXl]}>
                  {removalOnlyText}
                </Text>
              )}
              {privacyPoolsAccount ? (
                // Fills the panel like the accounts list does, so Proceed sits at its bottom
                <View style={[flexbox.flex1, spacings.mbLg]}>
                  <PrivacyPoolsAccountPersonalizeCard
                    name={privacyPoolsAccount.name}
                    sourceText={privacyPoolsAccount.sourceText}
                    disableEdit={isAdding}
                    onSaveName={handleSavePrivacyPoolsAccountName}
                  />
                </View>
              ) : (
                <PersonalizeAccountsList
                  fields={fields}
                  updatingKeysAddrs={updatingKeysAddrs}
                  alreadyAddedAddrs={alreadyAddedAddrs}
                  control={control}
                  accountsToRemove={accountsToRemove}
                  isAdding={isAdding}
                  onSaveName={handleSaveAccountName}
                  removalNote={removalNote}
                  ListEmptyComponent={listEmpty}
                  footer={SAFE_CREATE_SUMMARY}
                  style={spacings.mbLg}
                />
              )}
              <Button
                testID="button-proceed"
                size="large"
                type={isRemovalOnly ? 'danger' : 'primary'}
                onPress={handleProceed}
                hasBottomSpacing={false}
                text={proceedText}
                disabled={!canProceed}
              />
              {!!addMoreText && (
                <Button
                  testID="add-more-accounts-btn"
                  type="outline"
                  text={addMoreText}
                  // Adding more accounts is a step forward, even when the picker is the screen
                  // this flow arrived from (hardware wallets)
                  onPress={() => goToNextRoute(WEB_ROUTES.accountPicker, FORWARD_NAVIGATION_STATE)}
                  disabled={isAdding}
                  style={{ ...spacings.phMi, ...spacings.mtSm, height: 40 }}
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
  )
}

export default React.memo(AccountPersonalizeScreen)
