import React, { useMemo } from 'react'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import GlobeIcon from '@common/assets/svg/GlobeIcon'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar'
import CopyText from '@common/components/CopyText'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SafeCreateOwnerRow from '@common/modules/auth/components/SafeCreateOwnerRow'
import SafeCreateSectionLabel from '@common/modules/auth/components/SafeCreateSectionLabel'
import { SafeCreatePreview as Preview } from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  preview: Preview
}

const SHORTENED_ADDRESS_LENGTH = 13

/**
 * The summary of the Safe about to be created, shown on the preview step of Safe create
 * before the user confirms it: its address, approvals needed, version, owners and networks.
 * Its name is set on the personalize step that follows, so it isn't shown here.
 */
const SafeCreatePreview = ({ preview }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
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
          style={spacings.mbSm}
        />
      )}

      <View style={[styles.card, spacings.mtLg]}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
          <Avatar pfp={address} address={address} smartAccountType="Safe" size={48} />
          <View style={[flexbox.flex1, spacings.mlSm]}>
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
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text fontSize={14} appearance="secondaryText">
            {t('Approvals needed')}
          </Text>
          <Text fontSize={14} weight="semiBold" testID="safe-create-preview-approvals">
            {t('{{requiredConfirmations}} of {{ownersCount}} owners', {
              requiredConfirmations,
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
            {version}
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
            testID={`safe-create-preview-owner-${owner.address}`}
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

export default React.memo(SafeCreatePreview)
