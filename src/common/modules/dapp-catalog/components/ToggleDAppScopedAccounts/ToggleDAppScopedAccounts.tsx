import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import FatToggle from '@common/components/FatToggle'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

type Props = {
  enabled: boolean
  selectedCount: number
  onToggle: () => void
  onOpenAccountSelector?: () => void
  label?: string
}

const { isRequestWindow } = getUiType()

const ToggleDAppScopedAccounts: FC<Props> = ({
  enabled,
  selectedCount,
  onToggle,
  onOpenAccountSelector,
  label
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const PillContainer = onOpenAccountSelector ? HoverablePressable : View

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        common.fullWidth,
        {
          // Prevents layout shifts
          height: 30
        }
      ]}
    >
      <FatToggle
        width={40}
        height={20}
        labelProps={{ style: { fontSize: isRequestWindow ? 12 : 14 } }}
        label={label || t('Only connect with some accounts')}
        isOn={enabled}
        onToggle={onToggle}
        trackStyle={spacings.mrTy}
      />
      {enabled ? (
        <PillContainer
          style={{
            ...flexbox.directionRow,
            ...flexbox.alignCenter,
            ...spacings.pvMi,
            ...spacings.phSm,
            backgroundColor: theme.primaryAccent100,
            borderRadius: 50
          }}
          {...(onOpenAccountSelector && {
            onPress: onOpenAccountSelector
          })}
        >
          <Text fontSize={12} weight="medium" appearance="primary">
            {t('{{count}} account{{s}} selected', {
              count: selectedCount,
              s: selectedCount === 1 ? '' : 's'
            })}
          </Text>
        </PillContainer>
      ) : (
        <View />
      )}
    </View>
  )
}

export default React.memo(ToggleDAppScopedAccounts)
