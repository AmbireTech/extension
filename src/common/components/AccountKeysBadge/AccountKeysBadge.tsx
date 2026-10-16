import { nanoid } from 'nanoid'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import SafeIcon, { SAFE_ICON_INLINE_SCALE } from '@common/assets/svg/SafeIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import AccountKeyIcon from '@common/components/AccountKeyIcon'
import Badge from '@common/components/Badge'
import BADGE_PRESETS from '@common/components/BadgeWithPreset/presets'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const BADGE_HEIGHT = 20
const LEADING_ICON_SIZE = 16
const KEY_TYPE_ICON_SIZE = 14
const SEGMENT_PADDING_LEFT = 6
const SEGMENT_ICON_GAP = 3

/** The name of each kind of key on the badge, in words that a user new to wallets understands */
const KEY_TYPE_NAMES: { [type in Key['type']]: string } = {
  internal: 'Private key',
  ledger: 'Ledger',
  trezor: 'Trezor',
  lattice: 'GridPlus',
  qr: 'QR-based',
  nfc: 'NFC card',
  pq1: 'PQ1'
}

/** Named only, as their icon would be the key icon that the badge already starts with */
const KEY_TYPES_WITHOUT_ICON: Key['type'][] = ['internal', 'pq1']

interface Props {
  account: Account
  /** The account's own keystore keys, so a list of rows subscribes to them only once */
  accountKeys: Key[]
}

/**
 * Tells the user which kinds of keys can sign for the account, in a single badge that starts
 * with a key icon and names each kind. Without keys, it tells that the account is view-only.
 */
const AccountKeysBadge = ({ account, accountKeys }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const tooltipId = useMemo(() => nanoid(6), [])
  const keyTypes = useMemo(() => {
    const types = Array.from(new Set(accountKeys.map((key) => key.type)))

    // A private key can sign for the account on its own, so the other kinds add nothing
    return types.includes('internal') ? ['internal' as const] : types
  }, [accountKeys])

  if (account.safeCreation) {
    const safeIconSize = LEADING_ICON_SIZE * SAFE_ICON_INLINE_SCALE

    return (
      <Badge text="Safe" type="secondaryAccent" isIconLeading>
        <SafeIcon width={safeIconSize} height={safeIconSize} />
      </Badge>
    )
  }

  if (!keyTypes.length)
    return (
      <View
        dataSet={
          isWeb
            ? createGlobalTooltipDataSet({
                id: tooltipId,
                content: t(BADGE_PRESETS['view-only'].tooltipText)
              })
            : undefined
        }
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          {
            height: BADGE_HEIGHT,
            borderRadius: BADGE_HEIGHT / 2,
            borderWidth: 1,
            borderColor: theme.neutral600,
            overflow: 'hidden'
          }
        ]}
      >
        {/* The eye in place of the key icon, in a cell of its own like the key's */}
        <View
          style={[
            flexbox.alignCenter,
            flexbox.justifyCenter,
            {
              alignSelf: 'stretch',
              paddingLeft: 5,
              paddingRight: SPACING_MI,
              backgroundColor: hexToRgba(theme.secondaryText, 0.12)
            }
          ]}
        >
          <ViewOnlyIcon
            width={LEADING_ICON_SIZE}
            height={LEADING_ICON_SIZE}
            color={theme.secondaryText}
          />
        </View>
        <Text
          fontSize={12}
          weight="medium"
          color={theme.secondaryText}
          style={{ paddingLeft: SEGMENT_PADDING_LEFT, paddingRight: SPACING_TY }}
        >
          {t('View-only')}
        </Text>
      </View>
    )

  const segmentDividerColor = hexToRgba(theme.secondaryAccent400, 0.3)

  return (
    <View
      style={[
        flexbox.directionRow,
        {
          height: BADGE_HEIGHT,
          maxWidth: '100%',
          borderRadius: BADGE_HEIGHT / 2,
          overflow: 'hidden',
          backgroundColor: theme.secondaryAccent100
        }
      ]}
    >
      {/* Darker than the rest, so the key icon reads as what the names after it are */}
      <View
        style={[
          flexbox.alignCenter,
          flexbox.justifyCenter,
          {
            paddingLeft: SEGMENT_PADDING_LEFT,
            paddingRight: SPACING_MI,
            backgroundColor: hexToRgba(theme.secondaryAccent400, 0.12)
          }
        ]}
      >
        <SingleKeyIcon
          width={LEADING_ICON_SIZE}
          height={LEADING_ICON_SIZE}
          color={theme.secondaryAccent400}
        />
      </View>
      {keyTypes.map((type, index) => (
        <React.Fragment key={type}>
          {/* A view rather than a border, as per-side borders can leave stray lines on native */}
          {!!index && <View style={{ width: 1, backgroundColor: segmentDividerColor }} />}
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              {
                flexShrink: 1,
                columnGap: SEGMENT_ICON_GAP,
                paddingLeft: SEGMENT_PADDING_LEFT,
                paddingRight: SPACING_TY
              }
            ]}
          >
            {!KEY_TYPES_WITHOUT_ICON.includes(type) && (
              <AccountKeyIcon
                type={type}
                color={theme.secondaryAccent400}
                iconSize={KEY_TYPE_ICON_SIZE}
              />
            )}
            <Text
              fontSize={12}
              weight="semiBold"
              color={theme.secondaryAccent400}
              numberOfLines={1}
              style={{ flexShrink: 1 }}
            >
              {t(KEY_TYPE_NAMES[type])}
            </Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  )
}

export default React.memo(AccountKeysBadge)
