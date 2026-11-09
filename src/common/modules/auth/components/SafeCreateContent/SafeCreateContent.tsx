import React from 'react'
import { StyleProp, TextStyle } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import SafeCreateForm from '@common/modules/auth/components/SafeCreateForm'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'
import spacings from '@common/styles/spacings'

type Props = {
  safeCreate: ReturnType<typeof useSafeCreate>
  /** Positions the subtitle, e.g. to center it under a centered title */
  subtitleStyle?: StyleProp<TextStyle>
}

/**
 * The content of the Safe create screen (web and mobile): the subtitle and the owners form.
 * The details of the Safe these lead to are shown on the personalize step that follows.
 */
const SafeCreateContent = ({ safeCreate, subtitleStyle }: Props) => {
  const { t } = useTranslation()

  return (
    <>
      <Text fontSize={14} appearance="secondaryText" style={[spacings.mbTy, subtitleStyle]}>
        {t(
          'Set the signer wallets of your Safe account and how many need to confirm to execute a valid transaction.'
        )}
      </Text>
      <SafeCreateForm {...safeCreate} />
    </>
  )
}

export default React.memo(SafeCreateContent)
