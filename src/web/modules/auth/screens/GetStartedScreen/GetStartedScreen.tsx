import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import AmbireSmallWhiteLogo from '@web/components/AmbireSmallWhiteLogo'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'
import Card from '@web/modules/auth/components/Card'

import styles from './styles'

const GetStartedScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const [advanceModeEnabled, setAdvancedModeEnabled] = useState(false)

  const handleAuthButtonPress = useCallback((nextRoute: any) => navigate(nextRoute), [navigate])

  return (
    <>
      <AuthLayoutWrapperMainContent>
        <View style={[flexboxStyles.directionRow, flexboxStyles.justifyCenter]}>
          <Card
            text={t('Sign in your Ambire wallet with your email and manage your crypto assets.')}
          >
            <Button
              text={t('Email account')}
              onPress={() => handleAuthButtonPress(ROUTES.authEmailAccount)}
              hasBottomSpacing={false}
            />
          </Card>
          <Card
            style={{ marginHorizontal: 40 }}
            text={t('Safeguard your crypto assets by signing in with a trusted hardware wallet.')}
          >
            <Button
              text={t('HW Login')}
              onPress={() => handleAuthButtonPress(ROUTES.hardwareWalletSelect)}
              disabled // temporary disabled until we have this feature
              hasBottomSpacing={false}
            />
          </Card>
          <Card text={t('Import your existing Ambire account with a private key or passphrase.')}>
            <Button
              text={t('Import Account')}
              onPress={() => handleAuthButtonPress(ROUTES.externalSigner)}
              hasBottomSpacing={false}
            />
          </Card>
        </View>

        <View style={styles.hr} />

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
              <Text shouldScale={false} fontSize={12} weight="regular">
                {t(
                  'Import your wallet by uploading a JSON file. Access your existing wallet securely without the need to manually enter your private key or passphrase.'
                )}
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
              <Text shouldScale={false} fontSize={12} weight="regular">
                {t(
                  'Enter a public Ethereum address to access view mode, a non-interactive way to monitor balances, transaction history, and token holdings for any Ethereum account.'
                )}
              </Text>
            </View>
          </>
        )}
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent>
        <View style={[text.center, flexboxStyles.justifySpaceBetween, flexboxStyles.flex1]}>
          <View>
            <Text fontSize={40} weight="semiBold" color={colors.titan}>
              {t('Welcome')}
            </Text>
            <Text fontSize={20} color={colors.titan}>
              {t('to the Ambire Wallet Extension')}
            </Text>
            <Text fontSize={30} color={colors.titan}>
              v2.0
            </Text>
          </View>
          <AmbireSmallWhiteLogo style={styles.logo} />
        </View>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default GetStartedScreen
