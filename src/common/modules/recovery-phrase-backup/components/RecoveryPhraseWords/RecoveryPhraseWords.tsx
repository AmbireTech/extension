import React from 'react'
import { View } from 'react-native'

import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const COLUMNS = 3

const RecoveryPhraseWords = ({ words }: { words: string[] }) => {
  const { theme } = useTheme()
  const lastRowFirstIndex = words.length - (words.length % COLUMNS || COLUMNS)

  return (
    <ScrollableWrapper
      style={[spacings.mbTy]}
      contentContainerStyle={{
        ...flexbox.directionRow,
        ...flexbox.wrap,
        ...flexbox.justifyCenter,
        borderWidth: 1,
        borderColor: theme.neutral600,
        ...common.borderRadiusPrimary
      }}
    >
      {words.map((word, index) => (
        <View
          // The same word can appear twice in a phrase, so the position is part of the key
          key={`${index.toString()}-${word}`}
          style={{
            width: '33.33%',
            borderRightWidth: (index + 1) % COLUMNS === 0 ? 0 : 1,
            borderBottomWidth: index < lastRowFirstIndex ? 1 : 0,
            borderColor: theme.neutral600,
            ...spacings.pvMi,
            ...spacings.phTy,
            ...flexbox.alignCenter,
            height: 60
          }}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, { width: '100%' }]}>
            <Text
              fontSize={12}
              appearance="tertiaryText"
              weight="medium"
              style={{ lineHeight: isMobile ? 16 : 11 }}
            >
              {index + 1}.
            </Text>
          </View>
          <Text fontSize={14} weight="medium" style={{ lineHeight: 19 }}>
            {word}
          </Text>
        </View>
      ))}
    </ScrollableWrapper>
  )
}

export default React.memo(RecoveryPhraseWords)
