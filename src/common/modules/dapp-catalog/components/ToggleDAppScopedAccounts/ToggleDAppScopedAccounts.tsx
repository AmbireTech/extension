import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
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

const { isSidePanel } = getUiType()

const ToggleDAppScopedAccounts: FC<Props> = ({
  enabled,
  selectedCount,
  onToggle,
  onOpenAccountSelector,
  label
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  // Side panel is too narrow for toggle + account badge on one row.
  const stackToggleAndBadge = isSidePanel

  const PillContainer = onOpenAccountSelector ? HoverablePressable : View

  const accountBadge = enabled ? (
    <PillContainer
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        ...spacings.pvMi,
        ...spacings.plSm,
        ...spacings.prTy,
        backgroundColor: theme.primaryAccent100,
        borderRadius: 50,
        ...(stackToggleAndBadge ? { alignSelf: 'flex-start', ...spacings.mtTy } : {})
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
      <LeftArrowIcon
        color={theme.primaryAccent}
        width={6}
        height={13}
        style={{ ...spacings.mlMi, transform: [{ rotate: '180deg' }] }}
      />
    </PillContainer>
  ) : stackToggleAndBadge ? null : (
    <View />
  )

  return (
    <View
      style={[
        common.fullWidth,
        stackToggleAndBadge
          ? undefined
          : [
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              {
                // Prevents layout shifts
                height: 30
              }
            ]
      ]}
    >
      <FatToggle
        width={40}
        height={20}
        labelProps={{ style: { fontSize: 16 } }}
        label={label || t('Only connect some accounts')}
        isOn={enabled}
        onToggle={onToggle}
        trackStyle={spacings.mrTy}
      />
      {accountBadge}
    </View>
  )
}

export default React.memo(ToggleDAppScopedAccounts)
