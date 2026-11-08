import React from 'react'
import { ColorValue, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import { BUTTON_HEIGHT } from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** The width and height every import method icon is centered in, so the labels align */
export const IMPORT_METHOD_ICON_SLOT_SIZE = 24

/** An option on the import method selector screens */
export type ImportMethod = {
  title: string
  onPress: () => void
  icon: React.FC<SvgProps>
  /**
   * Icons that fill their whole box (like SafeIcon) must be drawn smaller than the slot
   * to match the ones that draw a circle inset in it. The slot keeps the labels aligned.
   */
  iconSize?: number
  /** Overrides the icon color, e.g. for a brand mark */
  iconColor?: ColorValue
}

/** The e2e test ID of an import method, made from its (untranslated) title */
export const getImportMethodTestID = (title: string) =>
  `import-method-${title.toLocaleLowerCase().split(' ').join('-')}`

// The nested options start where the title of the expandable method does, so they read as its own
const NESTED_IMPORT_METHOD_INDENT = SPACING_SM + IMPORT_METHOD_ICON_SLOT_SIZE + SPACING_SM
const NESTED_IMPORT_METHOD_HEIGHT = 44
const NESTED_IMPORT_METHOD_ICON_SLOT_SIZE = 20

const ImportMethodIcon = ({
  icon: IconComponent,
  iconSize = IMPORT_METHOD_ICON_SLOT_SIZE,
  iconColor,
  slotSize = IMPORT_METHOD_ICON_SLOT_SIZE
}: Pick<ImportMethod, 'icon' | 'iconSize' | 'iconColor'> & { slotSize?: number }) => {
  const { theme } = useTheme()

  return (
    <View style={[flexbox.center, { width: slotSize, height: slotSize }]}>
      <IconComponent width={iconSize} height={iconSize} color={iconColor || theme.iconPrimary} />
    </View>
  )
}

const NestedImportMethod = React.memo(
  ({ title, onPress, icon, iconSize, iconColor }: ImportMethod) => {
    const { theme } = useTheme()
    const { t } = useTranslation()
    const [bindHover, hoverStyle] = useCustomHover({
      property: 'backgroundColor',
      values: { from: theme.secondaryBackground, to: theme.tertiaryBackground }
    })
    // Drawn as small as the slot, keeping the size difference between icons
    const nestedIconSize =
      ((iconSize ?? IMPORT_METHOD_ICON_SLOT_SIZE) * NESTED_IMPORT_METHOD_ICON_SLOT_SIZE) /
      IMPORT_METHOD_ICON_SLOT_SIZE

    return (
      <AnimatedPressable
        onPress={onPress}
        testID={getImportMethodTestID(title)}
        style={[{ paddingLeft: NESTED_IMPORT_METHOD_INDENT }, hoverStyle]}
        {...bindHover}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.prSm,
            {
              height: NESTED_IMPORT_METHOD_HEIGHT,
              // Starts at the indent, like the list dividers of a settings screen
              borderTopWidth: 1,
              borderTopColor: theme.secondaryBorder
            }
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <ImportMethodIcon
              icon={icon}
              iconSize={nestedIconSize}
              iconColor={iconColor}
              slotSize={NESTED_IMPORT_METHOD_ICON_SLOT_SIZE}
            />
            <Text style={spacings.mlTy} fontSize={14} weight="medium">
              {t(title)}
            </Text>
          </View>
          <RightArrowIcon color={theme.iconSecondary} />
        </View>
      </AnimatedPressable>
    )
  }
)

NestedImportMethod.displayName = 'NestedImportMethod'

type Props = Pick<ImportMethod, 'title' | 'icon' | 'iconSize'> & {
  /** The import methods it opens into */
  options: ImportMethod[]
  isExpanded: boolean
  onToggle: () => void
}

/**
 * An import method that opens into several, e.g. the ways to import a Safe. Its options are
 * listed inside it, under its title, so they read as its own. As tall as an import method
 * button when closed.
 */
const ExpandableImportMethod = ({
  title,
  icon,
  iconSize,
  options,
  isExpanded,
  onToggle
}: Props) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [bindHover, hoverStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.secondaryBackground, to: theme.tertiaryBackground }
  })

  return (
    <View
      style={[
        spacings.mbSm,
        {
          // The same as the import method buttons, open or not, so it reads as one of them
          backgroundColor: theme.secondaryBackground,
          borderRadius: BORDER_RADIUS_PRIMARY,
          overflow: 'hidden'
        }
      ]}
    >
      <AnimatedPressable
        onPress={onToggle}
        testID={getImportMethodTestID(title)}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.phSm,
          // Keeps the expandable section the same height as the regular size buttons
          { height: BUTTON_HEIGHT },
          hoverStyle
        ]}
        {...bindHover}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <ImportMethodIcon icon={icon} iconSize={iconSize} />
          <Text style={spacings.mlSm} fontSize={16} weight="medium">
            {t(title)}
          </Text>
        </View>
        {isExpanded ? (
          <UpArrowIcon color={theme.iconPrimary} />
        ) : (
          <DownArrowIcon color={theme.iconPrimary} />
        )}
      </AnimatedPressable>
      {isExpanded && options.map((option) => <NestedImportMethod key={option.title} {...option} />)}
    </View>
  )
}

export default React.memo(ExpandableImportMethod)
