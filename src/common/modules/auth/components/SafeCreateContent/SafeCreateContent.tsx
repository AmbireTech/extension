import React from 'react'
import { StyleProp, TextStyle, View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import SafeCreateForm from '@common/modules/auth/components/SafeCreateForm'
import SafeCreatePreview from '@common/modules/auth/components/SafeCreatePreview'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'

type Props = {
  safeCreate: ReturnType<typeof useSafeCreate>
  /** Positions the subtitle, e.g. to center it under a centered title */
  subtitleStyle?: StyleProp<TextStyle>
}

/**
 * The content of the Safe create screen (web and mobile): the subtitle and either the
 * owners form or, on the preview step, the summary of the Safe about to be created.
 */
const SafeCreateContent = ({ safeCreate, subtitleStyle }: Props) => {
  const { t } = useTranslation()
  const { preview } = safeCreate

  return (
    <>
      <Text fontSize={14} appearance="secondaryText" style={[spacings.mbTy, subtitleStyle]}>
        {preview
          ? t('Check your new Safe before you create it')
          : t(
              'Set the signer wallets of your Safe account and how many need to confirm to execute a valid transaction.'
            )}
      </Text>
      {/* Hidden instead of unmounted on the preview, so going back finds it as it was */}
      <View style={preview ? { display: 'none' } : undefined}>
        <SafeCreateForm {...safeCreate} />
      </View>
      {!!preview && <SafeCreatePreview preview={preview} />}
    </>
  )
}

export default React.memo(SafeCreateContent)
