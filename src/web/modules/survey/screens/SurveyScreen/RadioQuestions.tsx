import React, { useMemo, useState } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type RadioResponsesProps = {
  selectedResponseId: number | null
  setSelectedResponseId: (id: number) => void
  responses: { text: string; id: number }[]
  forceLargeItems?: boolean
  style?: ViewStyle
}

export const RadioQuestions = React.memo(
  ({ responses, style, setSelectedResponseId, selectedResponseId }: RadioResponsesProps) => {
    const { styles, theme } = useTheme(getStyles)
    const [hovered, setHovered] = useState<number | null>(null)
    const responsesLength = useMemo(() => responses.length, [responses.length])
    return (
      <View style={[style, { gap: 16, flexDirection: 'column' }]}>
        {responses.map(({ text, id }, index) => (
          <Pressable
            key={id}
            style={[
              styles.selectItem,
              index !== responsesLength - 1 && styles.selectItemBorder,

              hovered === id && { backgroundColor: theme.secondaryBackground }
            ]}
            onPress={() => {
              if (id !== selectedResponseId) setSelectedResponseId(id)
            }}
            onHoverIn={() => setHovered(id)}
            onHoverOut={() => setHovered(null)}
          >
            <View style={[styles.radio]}>
              {(selectedResponseId === id || hovered === id) && (
                <View style={styles.radioSelectedInner} />
              )}
            </View>
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
              <Text fontSize={16} appearance={'primaryText'} style={flexbox.flex1}>
                {text}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    )
  }
)

export default React.memo(RadioQuestions)
