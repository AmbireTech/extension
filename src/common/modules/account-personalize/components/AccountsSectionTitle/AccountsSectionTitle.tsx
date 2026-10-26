import React from 'react'
import { View, ViewStyle } from 'react-native'

import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** How tall the title is - fixed, as the list it heads relies on it */
export const ACCOUNTS_SECTION_TITLE_HEIGHT = 32

type Props = {
  title: string
  count: number
  /** `error` for the accounts being removed */
  type?: 'primaryAccent' | 'error'
  style?: ViewStyle
}

/**
 * The title of a list of accounts on the personalize step, with how many there are. Opaque,
 * as it sticks to the top of the list while its accounts scroll under it.
 */
const AccountsSectionTitle = ({ title, count, type = 'primaryAccent', style }: Props) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.pbTy,
        spacings.plMi,
        { height: ACCOUNTS_SECTION_TITLE_HEIGHT, backgroundColor: theme.primaryBackground },
        style
      ]}
    >
      <Text fontSize={14} weight="semiBold" appearance="secondaryText" style={spacings.mrTy}>
        {title}
      </Text>
      <Badge text={String(count)} type={type} />
    </View>
  )
}

export default React.memo(AccountsSectionTitle)
