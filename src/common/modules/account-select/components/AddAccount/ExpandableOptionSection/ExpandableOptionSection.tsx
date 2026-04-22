import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DimensionValue, Pressable, ScrollView, View } from 'react-native'

import Option from '@common/components/Option'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'

import getStyles from './styles'

type Props = {
  dropdownText: string
  dropdownIcon: React.FC<any>
  dropdownTestID?: string
  options: OptionType[]
  icons?: { key: string; component: React.FC<any> }[]
  /**
   * Optional scroll container used to keep the expanded section visible.
   * When provided, the component scrolls to its own top after expanding so the
   * newly revealed options are shown in view instead of relying on manual offsets.
   */
  scrollViewRef?: React.RefObject<ScrollView>
  isExpanded?: boolean
  setIsExpanded?: (isExpanded: boolean) => void
}

type OptionType = {
  key: string
  text: string
  icon: React.FC<any>
  onPress: () => void
  testID: string
  wrapperWidth?: DimensionValue
}

const OptionItem = ({
  text,
  icon: Icon,
  onPress,
  testID,
  wrapperWidth = '33%'
}: Omit<OptionType, 'key'>) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()

  return (
    <Pressable
      style={({ hovered }: any) => [styles.option, hovered && styles.optionHovered]}
      onPress={onPress}
      testID={testID}
    >
      <Icon width={24} height={24} />
      <Text weight="medium" fontSize={14} style={spacings.mlSm} numberOfLines={1}>
        {t(text)}
      </Text>
    </Pressable>
  )
}

const ExpandableOptionSection = ({
  dropdownText,
  dropdownIcon,
  dropdownTestID,
  options,
  icons = [],
  scrollViewRef,
  isExpanded = false,
  setIsExpanded
}: Props) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const sectionRef = useRef<View>(null)
  const [internalIsExpanded, setInternalIsExpanded] = useState(false)
  const isControlled = setIsExpanded !== undefined

  // If the component is controlled, use the isExpanded prop, otherwise use internal state
  const expanded = isControlled ? isExpanded : internalIsExpanded

  const toggleHwOptions = useCallback(() => {
    if (setIsExpanded) {
      setIsExpanded(!expanded)
    } else {
      setInternalIsExpanded((p) => !p)
    }
  }, [setIsExpanded, expanded])

  const scrollIntoView = useCallback(() => {
    if (!scrollViewRef?.current || !sectionRef.current?.measure) return

    sectionRef.current.measure((_, y) => {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - SPACING_SM), animated: true })
    })
  }, [scrollViewRef])

  useEffect(() => {
    if (!expanded) return

    scrollIntoView()
  }, [expanded, scrollIntoView])

  const wrapperWidth = useMemo(() => {
    return `${100 / options.length}%` as DimensionValue
  }, [options])

  return (
    <Option
      text={t(dropdownText)}
      icon={dropdownIcon}
      onPress={toggleHwOptions}
      testID={dropdownTestID}
      status={expanded ? 'expanded' : 'collapsed'}
      icons={icons}
      ref={sectionRef}
    >
      {expanded && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <OptionItem
              key={option.key}
              text={option.text}
              icon={option.icon}
              onPress={option.onPress}
              testID={option.testID}
              wrapperWidth={wrapperWidth}
            />
          ))}
        </View>
      )}
    </Option>
  )
}
export default ExpandableOptionSection
