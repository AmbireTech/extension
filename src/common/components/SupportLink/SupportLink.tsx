import React from 'react'
import { TouchableOpacity } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { openInTab } from '@common/utils/links'

const SUPPORT_URL = 'https://help.ambire.com/en'

interface Props {
  label?: string
  fontSize?: number
}

/** Opens the help centre in a tab. Meant to be rendered inline, inside a sentence. */
const SupportLink = ({ label, fontSize = 14 }: Props) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()

  return (
    <TouchableOpacity
      onPress={() => openInTab({ url: SUPPORT_URL, shouldCloseCurrentWindow: true })}
    >
      <Text
        fontSize={fontSize}
        weight="medium"
        color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
      >
        {label || t('contact Support')}
      </Text>
    </TouchableOpacity>
  )
}

export default React.memo(SupportLink)
