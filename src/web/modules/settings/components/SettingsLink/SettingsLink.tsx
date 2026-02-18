import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { createTab } from '@web/extension-services/background/webapi/tab'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

interface Props {
  label: string
  path: string
  isActive: boolean
  Icon?: FC<SvgProps>
  isExternal?: boolean
  style?: ViewStyle
  isSidebarLink?: boolean
}

const SettingsLink: FC<Props> = ({
  label,
  path,
  Icon,
  isActive,
  isExternal,
  style,
  isSidebarLink
}) => {
  const { navigate } = useNavigation()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: isSidebarLink ? hexToRgba(theme.secondaryBackground, 0) : theme.primaryBackground,
      to: isSidebarLink ? theme.primaryBackground : theme.secondaryBackground
    }
  })
  const isDisabled = !Object.values(ROUTES).includes(path) && !isExternal

  return (
    <AnimatedPressable
      onPress={async () => {
        if (isExternal) {
          try {
            await createTab(path)
          } catch {
            addToast("Couldn't open link", { type: 'error' })
          }
          return
        }

        navigate(path)
      }}
      disabled={isDisabled}
      style={[
        flexbox.directionRow,
        flexbox.justifySpaceBetween,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.pv,
        isSidebarLink ? spacings.prLg : {},
        isSidebarLink ? spacings.mbMi : flexbox.flex1,
        {
          borderRadius: BORDER_RADIUS_PRIMARY
        },
        style,
        animStyle,
        isActive && {
          backgroundColor: isSidebarLink ? theme.primaryBackground : theme.secondaryBackground
        },
        isDisabled ? { opacity: 0.6 } : {}
      ]}
      {...bindAnim}
    >
      <View style={flexbox.directionRow}>
        {Icon ? (
          <Icon
            width={24}
            height={24}
            color={isSidebarLink && isActive ? theme.primaryAccent300 : theme.iconPrimary}
          />
        ) : null}
        <Text style={Icon ? spacings.mlSm : {}} weight="medium">
          {t(label)}
        </Text>
      </View>
      {!isSidebarLink && (
        <View
          style={{
            width: 24,
            height: 24,
            ...flexbox.center
          }}
        >
          <LeftArrowIcon
            style={{ transform: [{ rotate: '180deg' }] }}
            color={isHovered || isActive ? theme.primaryText : theme.iconPrimary}
          />
        </View>
      )}
    </AnimatedPressable>
  )
}

export default React.memo(SettingsLink)
