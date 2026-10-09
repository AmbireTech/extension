import React from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { SAFE_ICON_BACKGROUND_COLOR, SAFE_ICON_SYMBOL_COLOR } from '@common/assets/svg/SafeIcon'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'

const AVATAR_SIZE = 16
const SIGNER_OF_COLOR = hexToRgba('#000000', 0.6)

interface Props {
  /** The Safe accounts to tell the user the account is a signer of, see `useSafesSignedFor` */
  safes: Account[]
}

/**
 * Tells the user which of their Safe accounts the account can sign for. A Safe's signers
 * are accounts of their own, so they are synced to the other device only when picked.
 */
const SafeSignerBadges = ({ safes }: Props) => {
  const { t } = useTranslation()

  return (
    <>
      {safes.map((safe) => (
        <Badge
          key={safe.addr}
          style={{
            columnGap: SPACING_MI,
            // The avatar leads, so it sits closer to the edge than the text on the other side
            paddingLeft: SPACING_MI,
            paddingRight: SPACING_TY,
            maxWidth: '100%',
            // In the colors of the Safe icon, so the badge reads as Safe's in either theme
            backgroundColor: SAFE_ICON_BACKGROUND_COLOR
          }}
        >
          <Avatar
            address={safe.addr}
            pfp={safe.preferences.pfp}
            size={AVATAR_SIZE}
            displayTypeBadge={false}
            // The badge spaces its content itself
            style={spacings.pr0}
          />
          {/* Never shrinks, so that only the Safe's name is cut short when there is no room.
          Dimmed rather than in a theme color, as the badge is equally bright in both themes */}
          <Text
            fontSize={12}
            weight="medium"
            color={SIGNER_OF_COLOR}
            numberOfLines={1}
            style={{ flexShrink: 0 }}
          >
            {t('Signer of')}
          </Text>
          <Text
            fontSize={12}
            weight="semiBold"
            color={SAFE_ICON_SYMBOL_COLOR}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {safe.preferences.label}
          </Text>
        </Badge>
      ))}
    </>
  )
}

export default React.memo(SafeSignerBadges)
