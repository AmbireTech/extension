import React, { useCallback, useEffect, useMemo } from 'react'
import { View } from 'react-native'

import GlobeIcon from '@common/assets/svg/GlobeIcon'
import Alert from '@common/components/Alert'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import SafeCreateOwnerRow from '@common/modules/auth/components/SafeCreateOwnerRow'
import SafeCreateSectionLabel from '@common/modules/auth/components/SafeCreateSectionLabel'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useSafeOwnerDetails from '@common/modules/auth/hooks/useSafeOwnerDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** The Safe version `getNewSafeAccount` creates (see `SAFE_V1_4_1`) */
const NEW_SAFE_VERSION = '1.4.1'

const NETWORK_ICON_SIZE = 28
// The icons overlap, as on Safe import
const NETWORK_ICON_OVERLAP = -10

const selectReadyToAddAccounts = (state: AllControllersMappingType['AccountPickerController']) =>
  state.readyToAddAccounts

/**
 * The details of the Safe from Safe create, shown on the personalize step under the card
 * where the user names it: approvals needed, version, owners and networks. For a Safe in
 * the wallet already, it says so and shows the networks the Safe is active on.
 * Shows only while that step names the Safe from Safe create, nothing for any other flow.
 */
const SafeCreateSummary = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { safeCreateDraft } = useOnboardingNavigation()
  const { state: readyToAddAccounts } = useController(
    'AccountPickerController',
    selectReadyToAddAccounts
  )
  const getOwnerDetails = useSafeOwnerDetails()
  const isAlreadyInWallet = !!safeCreateDraft?.isAlreadyInWallet
  const isNamingTheNewSafe =
    !!safeCreateDraft &&
    readyToAddAccounts.length === 1 &&
    readyToAddAccounts[0]?.addr === safeCreateDraft.safeAddress
  const isShown = isAlreadyInWallet || isNamingTheNewSafe

  // Only a Safe in the wallet can be active somewhere. Joined into a string, so the selector
  // gives the same value on every update until the networks change
  const existingSafeAddr = isAlreadyInWallet ? safeCreateDraft?.safeAddress : undefined
  const selectActiveChainIds = useCallback(
    (state: AllControllersMappingType['AccountsController']) => {
      const accountStatesByNetwork = existingSafeAddr
        ? state.accountStates[existingSafeAddr]
        : undefined
      if (!accountStatesByNetwork) return ''

      return Object.entries(accountStatesByNetwork)
        .filter(([, { isDeployed }]) => isDeployed)
        .map(([chainId]) => chainId)
        .join(',')
    },
    [existingSafeAddr]
  )
  const { state: activeChainIdsKey, dispatch: accountsDispatch } = useController(
    'AccountsController',
    selectActiveChainIds
  )
  const activeChainIds = useMemo(
    () => (activeChainIdsKey ? activeChainIdsKey.split(',') : []),
    [activeChainIdsKey]
  )

  // The wallet keeps the network state of only some accounts up to date, so it's refreshed
  // for the Safe shown here
  useEffect(() => {
    if (!existingSafeAddr) return

    accountsDispatch({
      type: 'method',
      params: { method: 'updateAccountState', args: [existingSafeAddr, 'latest'] }
    })
  }, [existingSafeAddr, accountsDispatch])

  const owners = useMemo(
    () => safeCreateDraft?.ownerAddresses.map((address) => getOwnerDetails(address)) ?? [],
    [safeCreateDraft, getOwnerDetails]
  )
  const signingOwnersCount = useMemo(() => owners.filter(({ canSign }) => canSign).length, [owners])

  if (!isShown || !safeCreateDraft) return null

  return (
    <View testID="safe-create-summary">
      {isAlreadyInWallet && (
        <Alert
          type="info"
          text={t(
            'This Safe account is already in your wallet. The same owners and approvals always lead to the same account, so there is nothing new to add.'
          )}
          title="Already in wallet"
          style={spacings.mtLg}
        />
      )}
      {!signingOwnersCount && (
        <Alert
          type="warning"
          title={t("You can't sign for this Safe")}
          text={t(
            "None of its owners can sign with the keys in your wallet. You'll be able to see this Safe, but not send from it. Go back to add an account you can sign with as an owner."
          )}
          style={spacings.mtLg}
        />
      )}

      <View style={[styles.card, spacings.mtLg]}>
        <View style={styles.row}>
          <Text fontSize={14} appearance="secondaryText">
            {t('Approvals needed')}
          </Text>
          <Text fontSize={14} weight="semiBold" testID="safe-create-summary-approvals">
            {t('{{requiredConfirmations}} of {{ownersCount}} owners', {
              requiredConfirmations: safeCreateDraft.requiredConfirmations,
              ownersCount: owners.length
            })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text fontSize={14} appearance="secondaryText">
            {t('Safe version')}
          </Text>
          <Text fontSize={14} weight="semiBold">
            {NEW_SAFE_VERSION}
          </Text>
        </View>
      </View>

      <SafeCreateSectionLabel>
        {t('Owners · {{ownersCount}}', { ownersCount: owners.length })}
      </SafeCreateSectionLabel>
      <View style={styles.card}>
        {owners.map((owner, index) => (
          <SafeCreateOwnerRow
            key={owner.address}
            owner={owner}
            withDivider={index < owners.length - 1}
            testID={`safe-create-summary-owner-${owner.address}`}
          />
        ))}
      </View>

      <SafeCreateSectionLabel>{t('Active on networks')}</SafeCreateSectionLabel>
      <View style={[styles.card, styles.row]}>
        {activeChainIds.length ? (
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
            {activeChainIds.map((chainId, index) => (
              <NetworkIcon
                key={chainId}
                id={chainId}
                size={NETWORK_ICON_SIZE}
                style={index ? { marginLeft: NETWORK_ICON_OVERLAP } : undefined}
              />
            ))}
          </View>
        ) : (
          <>
            <View style={styles.networksIcon}>
              <GlobeIcon width={18} height={18} color={theme.iconPrimary} />
            </View>
            <Text fontSize={14} weight="medium" appearance="secondaryText" style={flexbox.flex1}>
              {t('Not active on any network yet')}
            </Text>
          </>
        )}
      </View>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mtTy}>
        {activeChainIds.length
          ? t('Activate it on more networks from the dashboard.')
          : t('Activate it on the networks you want from the dashboard.')}
      </Text>
    </View>
  )
}

export default React.memo(SafeCreateSummary)
