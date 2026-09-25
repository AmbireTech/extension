import React, { useMemo } from 'react'
import { View } from 'react-native'

import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import Avatar from '@common/components/Avatar'
import BadgeWithPreset from '@common/components/BadgeWithPreset'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

const AccountDataDetailed = () => {
  const { t } = useTranslation()
  const { isNarrowWebLayout } = useCompactActionRequestLayout()
  const { state: account } = useController('SelectedAccountController', selectAccount)
  // Selected in place of a regular account, and shown the way the account lists show it
  const { selectedAccount: privacyPoolsAccount } = usePrivacyPoolsAccounts()
  const reverseLookup = useReverseLookup({
    address: account?.addr || ''
  })

  const smartAccountType = useMemo(() => {
    if (account?.creation) return 'Ambire'
    if (account?.safeCreation) return 'Safe'
    return undefined
  }, [account])

  if (!account && privacyPoolsAccount)
    return (
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.flex1,
          isNarrowWebLayout && { minWidth: 0 }
        ]}
      >
        <PrivacyPoolsAccountAvatar style={spacings.mrTy} />
        <View
          style={[
            flexbox.flex1,
            isNarrowWebLayout && spacings.mlSm,
            isNarrowWebLayout && { minWidth: 0 }
          ]}
        >
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              isNarrowWebLayout && { minWidth: 0 }
            ]}
          >
            <Text
              fontSize={16}
              weight="semiBold"
              numberOfLines={1}
              style={[spacings.mrTy, isNarrowWebLayout && { flexShrink: 1, minWidth: 0 }]}
            >
              {privacyPoolsAccount.label}
            </Text>
            <BadgeWithPreset preset="privacy-pools" withRightSpacing={false} />
          </View>
          <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
            {t('Private account, no public address')}
          </Text>
        </View>
      </View>
    )

  if (!account) return null

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.flex1,
        isNarrowWebLayout && { minWidth: 0 }
      ]}
    >
      <Avatar
        address={account.addr}
        pfp={account.preferences.pfp}
        smartAccountType={smartAccountType}
      />
      <View
        style={[
          flexbox.flex1,
          isNarrowWebLayout && spacings.mlSm,
          isNarrowWebLayout && { minWidth: 0 }
        ]}
      >
        <View
          style={[flexbox.directionRow, flexbox.alignCenter, isNarrowWebLayout && { minWidth: 0 }]}
        >
          <Text
            fontSize={16}
            weight="semiBold"
            numberOfLines={1}
            // A long label would otherwise push the badges out of the narrow panel
            style={isNarrowWebLayout ? { flexShrink: 1, minWidth: 0 } : undefined}
          >
            {account.preferences.label}
          </Text>
          <AccountBadges accountData={account} />
        </View>
        <View
          style={[flexbox.directionRow, flexbox.alignCenter, isNarrowWebLayout && { minWidth: 0 }]}
        >
          {isNarrowWebLayout ? (
            <AccountAddress
              {...reverseLookup}
              address={account.addr}
              plainAddressMaxLength={16}
              withCopy={false}
            />
          ) : (
            <AccountAddress {...reverseLookup} address={account.addr} withCopy={isWeb} />
          )}
        </View>
      </View>
    </View>
  )
}

export default AccountDataDetailed
