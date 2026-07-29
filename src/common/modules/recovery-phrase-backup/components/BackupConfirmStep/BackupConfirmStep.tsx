import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { WordToConfirm } from '@common/modules/recovery-phrase-backup/hooks/useRecoveryPhraseBackup/useRecoveryPhraseBackup'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  wordsToConfirm: WordToConfirm[]
  enteredWords: string[]
  onEnteredWordChange: (index: number, value: string) => void
  areEnteredWordsValid: boolean
  onFinishPress: () => void
}

const BackupConfirmStep = ({
  wordsToConfirm,
  enteredWords,
  onEnteredWordChange,
  areEnteredWordsValid,
  onFinishPress
}: Props) => {
  const { t } = useTranslation()

  return (
    <View style={flexbox.flex1}>
      <Text weight="semiBold" fontSize={16} style={spacings.mbTy}>
        {t("Let's double check it")}
      </Text>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbMd}>
        {t('Enter the following words from your recovery phrase to confirm you wrote it down.')}
      </Text>

      <View style={flexbox.flex1}>
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
            />
          )
        })}
      </View>

      <Button
        testID="finish-recovery-phrase-backup-button"
        text={t('Finish')}
        size="large"
        hasBottomSpacing={false}
        disabled={!areEnteredWordsValid}
        onPress={onFinishPress}
      />
    </View>
  )
}

export default React.memo(BackupConfirmStep)
