import React from 'react'
import { View } from 'react-native'

import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
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
        ...common.borderRadiusPrimary,
        // The grid never sits at the screen bottom, so the wrapper's safe area inset would
        // only add dead space between the last row and the border
        paddingBottom: 0,
        // The wrapper's scrollbar padding would keep the row separators short of the right border
        paddingRight: 0
      }}
    >
      {words.map((word, index) => (
        <View
          // The same word can appear twice in a phrase, so the position is part of the key
          key={`${index.toString()}-${word}`}
          style={{
            width: '33.33%',
            ...spacings.pvMi,
            ...spacings.phTy,
            ...flexbox.alignCenter,
            ...flexbox.justifyCenter,
            height: 60
          }}
        >
          {/* Taken out of the flow, so the word stays centered in the whole cell */}
          <View
            style={{
              position: 'absolute',
              top: SPACING_MI,
              left: SPACING_TY
            }}
          >
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
          {/* Drawn as views rather than the cell's own borderRight/borderBottom, because */}
          {/* per side border widths were leaking onto the next step as stray grey lines */}
          {(index + 1) % COLUMNS !== 0 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: 1,
                backgroundColor: theme.neutral600
              }}
            />
          )}
          {index < lastRowFirstIndex && (
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 1,
                backgroundColor: theme.neutral600
              }}
            />
          )}
        </View>
      ))}
    </ScrollableWrapper>
  )
}

export default React.memo(RecoveryPhraseWords)
