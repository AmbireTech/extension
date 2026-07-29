import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { WordToConfirm } from '@common/modules/recovery-phrase-backup/hooks/useRecoveryPhraseBackup/useRecoveryPhraseBackup'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  wordsToConfirm: WordToConfirm[]
  enteredWords: string[]
  onEnteredWordChange: (index: number, value: string) => void
  areEnteredWordsValid: boolean
  onGoBackPress: () => void
  onFinishPress: () => void
}

const BackupConfirmStep = ({
  wordsToConfirm,
  enteredWords,
  onEnteredWordChange,
  areEnteredWordsValid,
  onGoBackPress,
  onFinishPress
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={flexbox.flex1}>
      <Text weight="semiBold" fontSize={16} style={spacings.mbTy}>
        {t("Let's double check it")}
      </Text>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbMd}>
        {t('Enter the following words from your recovery phrase to confirm you wrote it down.')}
      </Text>

      <View style={[flexbox.flex1, spacings.mbMd]}>
        {wordsToConfirm.map(({ position, word }, index) => {
          const enteredWord = enteredWords[index] || ''
          const isMismatching = !!enteredWord && enteredWord.trim() !== word

          return (
            <Input
              key={position}
              testID={`confirm-recovery-phrase-word-${position}`}
              label={t('Word #{{position}}', { position })}
              placeholder={t('Enter word #{{position}}', { position })}
              value={enteredWord}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(value: string) => onEnteredWordChange(index, value)}
              isValid={enteredWord.trim() === word}
              error={
                isMismatching
                  ? t("This word doesn't match. Please check what you wrote down.")
                  : undefined
              }
              // The sheet itself is on primaryBackground, so the fields need to stand out from it
              backgroundColor={theme.secondaryBackground}
            />
          )
        })}
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
          disabled={!areEnteredWordsValid}
          onPress={onFinishPress}
        />
      </View>
    </View>
  )
}

export default React.memo(BackupConfirmStep)
