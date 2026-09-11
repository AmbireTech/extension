import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import FatToggle from '@common/components/FatToggle'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
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
  disabled?: boolean
  /** Explains why the toggle can't be used. The id must be unique per screen. */
  disabledTooltip?: { id: string; content: string }
}

const { isSidePanel } = getUiType()

const ToggleDAppScopedAccounts: FC<Props> = ({
  enabled,
  selectedCount,
  onToggle,
  onOpenAccountSelector,
  label,
  disabled,
  disabledTooltip
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  // Side panel is too narrow for toggle + account badge on one row.
  const stackToggleAndBadge = isSidePanel
  const canOpenAccountSelector = !disabled && !!onOpenAccountSelector

  const PillContainer = canOpenAccountSelector ? HoverablePressable : View

  const accountBadge =
    enabled && !disabled ? (
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
        {...(canOpenAccountSelector && {
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

  const toggle = (
    <FatToggle
      width={40}
      height={20}
      labelProps={{ style: { fontSize: 16 } }}
      label={label || t('Only connect some accounts')}
      isOn={enabled}
      onToggle={onToggle}
      disabled={disabled}
      trackStyle={spacings.mrTy}
    />
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
      {disabledTooltip ? (
        <View
          style={flexbox.alignSelfStart}
          dataSet={createGlobalTooltipDataSet({
            id: disabledTooltip.id,
            hidden: !disabled,
            content: disabledTooltip.content
          })}
        >
          {toggle}
        </View>
      ) : (
        toggle
      )}
      {accountBadge}
    </View>
  )
}

export default React.memo(ToggleDAppScopedAccounts)
