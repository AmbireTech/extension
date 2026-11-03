import React, { useMemo } from 'react'
import { View } from 'react-native'

import GlobeIcon from '@common/assets/svg/GlobeIcon'
import Alert from '@common/components/Alert'
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

const selectReadyToAddAccounts = (state: AllControllersMappingType['AccountPickerController']) =>
  state.readyToAddAccounts

/**
 * The details of the Safe about to be created, shown on the personalize step under the
 * card where the user names it: approvals needed, version, owners and networks.
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
  const isNamingTheNewSafe =
    !!safeCreateDraft &&
    readyToAddAccounts.length === 1 &&
    readyToAddAccounts[0]?.addr === safeCreateDraft.safeAddress

  const owners = useMemo(
    () => safeCreateDraft?.ownerAddresses.map((address) => getOwnerDetails(address)) ?? [],
    [safeCreateDraft, getOwnerDetails]
  )
  const signingOwnersCount = useMemo(() => owners.filter(({ canSign }) => canSign).length, [owners])

  if (!isNamingTheNewSafe || !safeCreateDraft) return null

  return (
    <View testID="safe-create-summary">
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
            withSigningBadge
            withDivider={index < owners.length - 1}
            testID={`safe-create-summary-owner-${owner.address}`}
          />
        ))}
      </View>

      <SafeCreateSectionLabel>{t('Active on networks')}</SafeCreateSectionLabel>
      <View style={[styles.card, styles.row]}>
        <View style={styles.networksIcon}>
          <GlobeIcon width={18} height={18} color={theme.iconPrimary} />
        </View>
        <Text fontSize={14} weight="medium" appearance="secondaryText" style={flexbox.flex1}>
          {t('Not active on any network yet')}
        </Text>
      </View>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mtTy}>
        {t('Activate it on the networks you want from the dashboard.')}
      </Text>
    </View>
  )
}

export default React.memo(SafeCreateSummary)
