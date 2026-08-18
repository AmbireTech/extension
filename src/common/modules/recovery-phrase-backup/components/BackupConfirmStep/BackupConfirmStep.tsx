import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { WordToConfirm } from '@common/modules/recovery-phrase-backup/hooks/useRecoveryPhraseBackup/useRecoveryPhraseBackup'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import WordOption from './WordOption'

type Props = {
  wordsToConfirm: WordToConfirm[]
  selectedWords: string[]
  onWordSelect: (index: number, value: string) => void
  areSelectedWordsValid: boolean
  onGoBackPress: () => void
  onFinishPress: () => void
}

const BackupConfirmStep = ({
  wordsToConfirm,
  selectedWords,
  onWordSelect,
  areSelectedWordsValid,
  onGoBackPress,
  onFinishPress
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={flexbox.flex1}>
      <Text weight="semiBold" fontSize={16} style={spacings.mbMd}>
        {t("Let's double check it")}
      </Text>

      <View style={flexbox.flex1}>
        {wordsToConfirm.map(({ position, word, options }, index) => {
          const selectedWord = selectedWords[index] || ''
          const selectedOptionIndex = options.indexOf(selectedWord)

          return (
            <View key={position} style={spacings.mbMd}>
              <Text fontSize={14} appearance="secondaryText" style={spacings.mbTy}>
                {t('Select word #{{position}}', { position })}
              </Text>
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  common.borderRadiusPrimary,
                  { backgroundColor: theme.secondaryBackground }
                ]}
              >
                {options.map((option, optionIndex) => {
                  // The separator sits on the option's right edge, so the one touching either
                  // side of the selected option is the selected option's own and its left neighbour's
                  const isNextToSelectedOption =
                    optionIndex === selectedOptionIndex || optionIndex + 1 === selectedOptionIndex

                  return (
                    <WordOption
                      key={option}
                      option={option}
                      position={position}
                      wordIndex={index}
                      isSelected={selectedWord === option}
                      isCorrect={option === word}
                      hasSeparator={optionIndex < options.length - 1 && !isNextToSelectedOption}
                      onSelect={onWordSelect}
                    />
                  )
                })}
              </View>
            </View>
          )
        })}

        <Text fontSize={12} appearance="secondaryText" style={spacings.mbMd}>
          {t('Please make sure your recovery phrase is written down correctly.')}
        </Text>
      </View>

      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Button
          testID="go-back-to-recovery-phrase-button"
          type="secondary"
          text={t('Go back')}
          size="large"
          hasBottomSpacing={false}
          style={[flexbox.flex1, spacings.mrTy]}
          onPress={onGoBackPress}
        />
        <Button
          testID="finish-recovery-phrase-backup-button"
          text={t('Finish')}
          size="large"
          hasBottomSpacing={false}
          style={flexbox.flex1}
          disabled={!areSelectedWordsValid}
          onPress={onFinishPress}
        />
      </View>
    </View>
  )
}

export default React.memo(BackupConfirmStep)
