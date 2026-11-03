import React, { useMemo } from 'react'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import SafeIcon from '@common/assets/svg/SafeIcon'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import CopyText from '@common/components/CopyText'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import {
  SafeCreatePreview as Preview,
  SafeCreatePreviewOwner
} from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

type Props = {
  preview: Preview
}

const SHORTENED_ADDRESS_LENGTH = 13

const SectionLabel = React.memo(({ children }: { children: string }) => (
  <Text
    fontSize={12}
    weight="medium"
    appearance="secondaryText"
    style={[text.uppercase, spacings.mtLg, spacings.mbTy]}
  >
    {children}
  </Text>
))

SectionLabel.displayName = 'SectionLabel'

const OwnerRow = React.memo(
  ({ owner, withDivider }: { owner: SafeCreatePreviewOwner; withDivider: boolean }) => {
    const { t } = useTranslation()
    const { styles } = useTheme(getStyles)
    const shortenedAddress = shortenAddress(owner.address, SHORTENED_ADDRESS_LENGTH)

    const badge = useMemo(() => {
      if (owner.canSign) return { type: 'success' as const, text: t('Can sign') }
      // An account in the wallet that none of the wallet's keys can sign for
      if (owner.isInWallet) return { type: 'default' as const, text: t('View only') }

      return { type: 'default' as const, text: t('Not in your wallet') }
    }, [owner.canSign, owner.isInWallet, t])

    return (
      <>
        <View style={styles.row} testID={`safe-create-preview-owner-${owner.address}`}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, spacings.mrSm]}>
            <Avatar pfp={owner.address} address={owner.address} size={32} />
            <View style={[flexbox.flex1, spacings.mlTy]}>
              <Text fontSize={14} weight="medium" numberOfLines={1}>
                {owner.name || shortenedAddress}
              </Text>
              {!!owner.name && (
                <Text fontSize={12} appearance="secondaryText">
                  {shortenedAddress}
                </Text>
              )}
            </View>
          </View>
          <Badge type={badge.type} text={badge.text} />
        </View>
        {withDivider && <View style={styles.divider} />}
      </>
    )
  }
)

OwnerRow.displayName = 'OwnerRow'

/**
 * The summary of the Safe about to be created, shown on the preview step of Safe create
 * before the user confirms it: its address, version, approvals needed and owners.
 */
const SafeCreatePreview = ({ preview }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { address, version, requiredConfirmations, owners } = preview

  const signingOwnersCount = useMemo(() => owners.filter(({ canSign }) => canSign).length, [owners])

  return (
    <View>
      {!signingOwnersCount && (
        <Alert
          type="warning"
          title={t("You can't sign for this Safe")}
          text={t(
            "None of its owners can sign with the keys in your wallet. You'll be able to see this Safe, but not send from it. Go back to add an account you can sign with as an owner."
          )}
          style={spacings.mbLg}
        />
      )}

      <View style={styles.card}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pbSm]}>
          <SafeIcon width={32} height={32} />
          <View style={[flexbox.flex1, spacings.mlTy]}>
            <Text fontSize={16} weight="semiBold">
              {t('Safe account')}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text fontSize={12} appearance="secondaryText" testID="safe-create-preview-address">
                {shortenAddress(address, SHORTENED_ADDRESS_LENGTH)}
              </Text>
              <CopyText text={address} iconSize={14} style={spacings.mlMi} />
            </View>
          </View>
          <Badge type="success" text={t('New')} />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text fontSize={14}>{t('Active on')}</Text>
          <Text fontSize={14} appearance="secondaryText">
            {t('Not yet')}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.row, spacings.pb0]}>
          <Text fontSize={14}>{t('Safe version')}</Text>
          <Text fontSize={14} weight="semiBold">
            {version}
          </Text>
        </View>
      </View>

      <SectionLabel>{t('Approvals needed')}</SectionLabel>
      <View style={styles.card}>
        <Text fontSize={16} weight="semiBold" testID="safe-create-preview-approvals">
          {t('{{requiredConfirmations}} of {{ownersCount}} owners', {
            requiredConfirmations,
            ownersCount: owners.length
          })}
        </Text>
        <Text fontSize={14} appearance="secondaryText" style={spacings.mtMi}>
          {t('The same on every network')}
        </Text>
      </View>

      <SectionLabel>{t('Owners · {{ownersCount}}', { ownersCount: owners.length })}</SectionLabel>
      <View style={styles.ownersCard}>
        {owners.map((owner, index) => (
          <OwnerRow key={owner.address} owner={owner} withDivider={index < owners.length - 1} />
        ))}
      </View>
    </View>
  )
}

export default React.memo(SafeCreatePreview)
