import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@modules/common/components/BottomSheet'
import Button from '@modules/common/components/Button'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import useTheme from '@modules/common/hooks/useTheme'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import { THEME_TYPES } from '@modules/common/styles/themeConfig'
import textStyles from '@modules/common/styles/utils/text'

const Theme = () => {
  const { t } = useTranslation()
  const { setThemeType, themeType } = useTheme()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const handleOnThemeChange = (type: THEME_TYPES) => {
    setThemeType(type)
    closeBottomSheet()
  }

  const themeNames = {
    [THEME_TYPES.AUTO]: t('Auto (coming soon)'),
    [THEME_TYPES.DARK]: t('Dark Mode'),
    [THEME_TYPES.LIGHT]: t('Light Mode (coming soon)')
  }

  return (
    <>
      <TouchableOpacity onPress={openBottomSheet}>
        <Text style={spacings.mbSm} color={colors.titan_50}>
          {t('Theme: {{themeName}}', { themeName: themeNames[themeType] })}
        </Text>
      </TouchableOpacity>
      <BottomSheet id="change-theme" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
        <Title style={textStyles.center}>{t('Change app theme')}</Title>

        {Object.values(THEME_TYPES).map((type) => (
          <Button
            key={type}
            text={themeNames[type]}
            disabled={type !== THEME_TYPES.DARK}
            onPress={() => handleOnThemeChange(type)}
          />
        ))}
      </BottomSheet>
    </>
  )
}

export default Theme
