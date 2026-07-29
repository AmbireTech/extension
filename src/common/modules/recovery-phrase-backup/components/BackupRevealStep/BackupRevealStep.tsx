import React from 'react'
import { View } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import RecoveryPhraseWords from '@common/modules/recovery-phrase-backup/components/RecoveryPhraseWords'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  seedWords: string[]
  onCopyPress: () => void
  onContinuePress: () => void
}

const BackupRevealStep = ({ seedWords, onCopyPress, onContinuePress }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  if (!seedWords.length) {
    return (
      <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Spinner style={{ width: 16, height: 16 }} />
      </View>
    )
  }

  return (
    <View style={flexbox.flex1}>
      <Text weight="medium" appearance="secondaryText" style={spacings.mbMd}>
        {t('Write down and secure the recovery phrase for your account.')}
      </Text>

      <View style={flexbox.flex1}>
        <RecoveryPhraseWords words={seedWords} />
        <View
          style={[
            flexbox.directionRow,
            flexbox.justifyCenter,
            flexbox.alignCenter,
            spacings.ptTy,
            common.borderRadiusPrimary,
            spacings.mbXl
          ]}
        >
          <Button
            type="tertiary"
            text={t('Copy recovery phrase')}
            hasBottomSpacing={false}
            size="small"
            testID="copy-recovery-phrase"
            onPress={onCopyPress}
          >
            <CopyIcon style={spacings.mlTy} color={theme.iconPrimary} />
          </Button>
        </View>
      </View>

      <Button
        testID="recovery-phrase-saved-button"
        text={t("I've saved the phrase")}
        size="large"
        hasBottomSpacing={false}
        onPress={onContinuePress}
      />
    </View>
  )
}

export default React.memo(BackupRevealStep)
