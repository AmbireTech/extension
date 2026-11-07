import React from 'react'
import { ViewStyle } from 'react-native'

import LockIcon from '@common/assets/svg/LockIcon'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

type Props = {
  /** What follows "Passphrase", e.g. "1". Phrases saved before passphrases had names have none */
  passphraseLabel?: string
  style?: ViewStyle
}

/** Marks a recovery phrase added with a passphrase, e.g. "with Passphrase 1" */
const PassphraseBadge = ({ passphraseLabel, style }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <Badge
      type="primaryAccent"
      isIconLeading
      style={{ height: 18, ...style }}
      testId="passphrase-badge"
    >
      <LockIcon width={12} height={12} color={theme.primaryAccent300} />
      <Text fontSize={11} color={theme.primaryAccent300} style={spacings.mlMi} numberOfLines={1}>
        {t('with')}{' '}
        <Text fontSize={11} weight="medium" color={theme.primaryAccent300}>
          {passphraseLabel
            ? t('Passphrase {{passphraseLabel}}', { passphraseLabel })
            : t('Passphrase')}
        </Text>
      </Text>
    </Badge>
  )
}

export default React.memo(PassphraseBadge)
