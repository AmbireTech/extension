import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import getStyles from '@common/modules/dashboard/components/DeFiPositions/DeFiProviderPosition/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  columns: {
    label: string
    flex: number
  }[]
}

const DeFiPositionAssetsHeader: FC<Props> = ({ columns }) => {
  const { t } = useTranslation()
  const { theme } = useTheme(getStyles)
  const { isCompactLayout } = useCompactActionRequestLayout()
  const headerFontSize = isCompactLayout ? 10 : 12

  return (
    <View
      style={[
        flexbox.directionRow,
        spacings.phSm,
        spacings.pvMi,
        flexbox.alignCenter,
        {
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          backgroundColor: theme.secondaryBackground
        }
      ]}
    >
      {columns.map(({ label, flex }, index) => (
        <Text
          key={label}
          style={{
            flex,
            minWidth: 0,
            textAlign: index === columns.length - 1 ? 'right' : 'left'
          }}
          fontSize={headerFontSize}
          appearance="tertiaryText"
          weight="medium"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {t(label)}
        </Text>
      ))}
    </View>
  )
}

export default React.memo(DeFiPositionAssetsHeader)
