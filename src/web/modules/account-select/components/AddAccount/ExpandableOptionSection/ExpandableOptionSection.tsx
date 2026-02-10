import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DimensionValue, Pressable, View } from 'react-native'

import Option from '@common/components/Option'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

type Props = {
  dropdownText: string
  dropdownIcon: React.FC<any>
  dropdownTestID?: string
  options: OptionType[]
  icons?: { key: string; component: React.FC<any> }[]
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
    <View style={{ ...styles.optionWrapper, width: wrapperWidth }}>
      <Pressable
        style={({ hovered }: any) => [styles.option, hovered && styles.optionHovered]}
        onPress={onPress}
        testID={testID}
      >
        <Icon width={44} height={44} />
        <Text fontSize={14} weight="medium" style={spacings.mtMi} numberOfLines={1}>
          {t(text)}
        </Text>
      </Pressable>
    </View>
  )
}

const ExpandableOptionSection = ({
  dropdownText,
  dropdownIcon,
  dropdownTestID,
  options,
  icons = []
}: Props) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const [isOptionExpanded, setIsOptionExpanded] = useState(false)

  const toggleHwOptions = useCallback(() => {
    setIsOptionExpanded((p) => !p)
  }, [])

  const wrapperWidth = useMemo(() => {
    return `${100 / options.length}%` as DimensionValue
  }, [options])

  return (
    <Option
      text={t(dropdownText)}
      icon={dropdownIcon}
      iconProps={{ width: 30, height: 30 }}
      onPress={toggleHwOptions}
      testID={dropdownTestID}
      status={isOptionExpanded ? 'expanded' : 'collapsed'}
      icons={icons}
    >
      {isOptionExpanded && (
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
