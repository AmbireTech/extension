import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/config/routesConfig'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexboxStyles from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import AmbireLogo from '@web/components/AmbireLogo/AmbireLogo'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'
import Card from '@web/components/Card'

const GetStartedScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const [advanceModeEnabled, setAdvancedModeEnabled] = useState(true)

  const handleAuthButtonPress = useCallback((nextRoute: ROUTES) => navigate(nextRoute), [navigate])

  return (
    <>
      <AuthLayoutWrapperMainContent>
        <View style={[flexboxStyles.directionRow, flexboxStyles.justifyCenter]}>
          <Card text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium, rerum?">
            <Button
              text={t('Email account')}
              onPress={() => handleAuthButtonPress(ROUTES.authEmailAccount)}
              hasBottomSpacing={false}
            />
          </Card>
          <Card
            style={{ marginHorizontal: 40 }}
            text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium, rerum?"
          >
            <Button
              text={t('HW Login')}
              onPress={() => handleAuthButtonPress(ROUTES.hardwareWallet)}
              disabled // temporary disabled until we have this feature
              hasBottomSpacing={false}
            />
          </Card>
          <Card text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium, rerum?">
            <Button
              text={t('Import Account')}
              onPress={() => handleAuthButtonPress(ROUTES.externalSigner)}
              hasBottomSpacing={false}
            />
          </Card>
        </View>

        <View style={{ marginVertical: 70, height: 1, backgroundColor: colors.mischka }} />

        <Toggle
          id="advanced-mode-toggle"
          isOn={advanceModeEnabled}
          label={t('Advanced mode')}
          onToggle={setAdvancedModeEnabled}
        />
        {advanceModeEnabled && (
          <>
            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mb]}>
              <Button
                text={t('Import JSON')}
                type="outline"
                hasBottomSpacing={false}
                style={[{ minWidth: 190, backgroundColor: colors.melrose_15 }, spacings.mrMd]}
                accentColor={colors.violet}
                onPress={() => handleAuthButtonPress(ROUTES.ambireAccountJsonLogin)}
              />
              <Text
                shouldScale={false}
                fontSize={12}
                weight="regular"
                themeType={THEME_TYPES.LIGHT}
              >
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eget ipsum mattis,
                pretium nibh vel, venenatis ligula.
              </Text>
            </View>
            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mb]}>
              <Button
                accentColor={colors.violet}
                text={t('View Mode')}
                disabled // temporary disabled until we have this feature
                type="outline"
                hasBottomSpacing={false}
                style={[{ minWidth: 190, backgroundColor: colors.melrose_15 }, spacings.mrMd]}
              />
              <Text
                shouldScale={false}
                fontSize={12}
                weight="regular"
                themeType={THEME_TYPES.LIGHT}
              >
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eget ipsum mattis,
                pretium nibh vel, venenatis ligula.
              </Text>
            </View>
          </>
        )}
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent>
        <View style={[text.center, flexboxStyles.justifySpaceBetween, flexboxStyles.flex1]}>
          <View>
            <Text fontSize={40} weight="semiBold">
              {t('Welcome')}
            </Text>
            <Text fontSize={20}>{t('to the Ambire Wallet Extension')}</Text>
            <Text fontSize={30}>v2.0</Text>
          </View>
          <AmbireLogo
            style={{ position: 'absolute', bottom: 27, right: '50%', marginRight: -46, zIndex: 10 }}
          />
        </View>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default GetStartedScreen
