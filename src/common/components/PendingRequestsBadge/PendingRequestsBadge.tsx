import React from 'react'
import { View } from 'react-native'

import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const COUNTER_SIZE = 14

interface Props {
  /** See `usePendingRequestsCount` */
  count: number
}

/** Tells the user how many requests wait for an account's signature, on all chains */
const PendingRequestsBadge = ({ count }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <Badge
      type="warning"
      isIconLeading
      style={{
        columnGap: SPACING_MI,
        // The badge leaves room only for a trailing info icon when it has children
        paddingRight: SPACING_TY
      }}
    >
      {/* A circle for a single digit, growing into a pill for more */}
      <View
        style={[
          flexbox.alignCenter,
          flexbox.justifyCenter,
          {
            minWidth: COUNTER_SIZE,
            height: COUNTER_SIZE,
            paddingHorizontal: 3,
            borderRadius: COUNTER_SIZE / 2,
            borderWidth: 1,
            borderColor: theme.warningText
          }
        ]}
      >
        <Text fontSize={10} weight="semiBold" color={theme.warningText}>
          {count}
        </Text>
      </View>
      <Text fontSize={12} weight="medium" color={theme.warningText}>
        {t('pending')}
      </Text>
    </Badge>
  )
}

export default React.memo(PendingRequestsBadge)
