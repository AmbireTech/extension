import React, { useCallback, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { Pressable } from 'react-native-web-hover'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useStepper from '@common/modules/auth/hooks/useStepper'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { AuthLayoutWrapperMainContent } from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'
import Card from '@web/modules/auth/components/Card'
import EmailIcon from '@web/modules/auth/screens/GetStartedScreen/EmailIcon'
import HWIcon from '@web/modules/auth/screens/GetStartedScreen/HWIcon'
import ImportAccountIcon from '@web/modules/auth/screens/GetStartedScreen/ImportAccountIcon'
import DownArrow from '@web/modules/auth/screens/GetStartedScreen/DownArrow'

import styles from './styles'

const GetStartedScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const [advanceModeEnabled, setAdvancedModeEnabled] = useState(true)
  const { updateStepperState } = useStepper()

  const handleAuthButtonPress = useCallback((nextRoute: any) => navigate(nextRoute), [navigate])

  return (
    <AuthLayoutWrapperMainContent fullWidth>
      <View style={[flexboxStyles.center]}>
        <Text fontSize={22} weight="medium">
          {t('Welcome to Ambire')}
        </Text>
        <Text fontSize={14} weight="medium" style={[spacings.mbLg]}>
          {t('Choose Account Type')}
        </Text>
        <View style={[flexboxStyles.directionRow]}>
          <Pressable
            onPress={() => {
              updateStepperState(0, 'emailAuth')
              handleAuthButtonPress(ROUTES.createEmailVault)
            }}
          >
            {({ hovered }) => (
              <Card
                title={t('Email account')}
                text={t(
                  'Create a smart account with email and password. This account will be recoverable via your email address.'
                )}
                icon={<EmailIcon color={hovered ? colors.violet : colors.melrose} />}
                style={{
                  borderWidth: 1,
                  borderColor: hovered ? colors.violet : colors.melrose_15,
                  ...flexboxStyles.flex1
                }}
              >
                <Button
                  textStyle={{ fontSize: 14 }}
                  style={{ width: 260 }}
                  text={t('Create Email Account')}
                  onPress={() => {
                    updateStepperState(0, 'emailAuth')
                    handleAuthButtonPress(ROUTES.createEmailVault)
                  }}
                  hasBottomSpacing={false}
                />
              </Card>
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              updateStepperState(0, 'hwAuth')
              handleAuthButtonPress(ROUTES.hardwareWalletSelect)
            }}
          >
            {({ hovered }) => (
              <Card
                title={t('Hardware wallet')}
                text={t(
                  'Import multiple accounts from a hardware wallet device: we support Trezor, Ledger and Grid+ Lattice.\n\nYou can import your existing legacy accounts and smart accounts.'
                )}
                style={{
                  marginHorizontal: 16,
                  borderWidth: 1,
                  borderColor: hovered ? colors.violet : colors.melrose_15,
                  ...flexboxStyles.flex1
                }}
                icon={<HWIcon color={hovered ? colors.violet : colors.melrose} />}
              >
                <Button
                  textStyle={{ fontSize: 14 }}
                  text={t('Import From Hardware Wallet')}
                  onPress={() => {
                    updateStepperState(0, 'hwAuth')
                    handleAuthButtonPress(ROUTES.hardwareWalletSelect)
                  }}
                  hasBottomSpacing={false}
                />
              </Card>
            )}
          </Pressable>
          <Pressable onPress={() => handleAuthButtonPress(ROUTES.externalSigner)}>
            {({ hovered }) => (
              <Card
                title={t('Legacy Account')}
                style={{
                  borderWidth: 1,
                  borderColor: hovered ? colors.violet : colors.melrose_15,
                  ...flexboxStyles.flex1
                }}
                text={t(
                  'Import a private key or seed phrase from a traditional wallet like Metamask.\n\nYou can import a legacy account but also create a fresh smart account from the same keys.'
                )}
                icon={<ImportAccountIcon color={hovered ? colors.violet : colors.melrose} />}
              >
                <Button
                  textStyle={{ fontSize: 14 }}
                  style={{ width: 260 }}
                  text={t('Import Legacy Account')}
                  onPress={() => handleAuthButtonPress(ROUTES.externalSigner)}
                  hasBottomSpacing={false}
                />
              </Card>
            )}
          </Pressable>
        </View>

        <View style={[flexboxStyles.directionRow, flexboxStyles.justifySpaceBetween]}>
          <View style={styles.hr} />
          <TouchableOpacity
            style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.ph]}
            onPress={() => setAdvancedModeEnabled(!advanceModeEnabled)}
          >
            <DownArrow isActive={advanceModeEnabled} />
            <Text fontSize={14} style={[spacings.mlMi]} weight="medium">
              {t('Show more options')}
            </Text>
          </TouchableOpacity>
          <View style={styles.hr} />
        </View>

        <View style={[flexboxStyles.flex1]}>
          {advanceModeEnabled && (
            <>
              <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mb]}>
                <Button
                  text={t('Import From File')}
                  type="outline"
                  hasBottomSpacing={false}
                  style={[{ minWidth: 190 }, spacings.mrMd]}
                  textStyle={{ fontSize: 14 }}
                  accentColor={colors.violet}
                  onPress={() => handleAuthButtonPress(ROUTES.ambireAccountJsonLogin)}
                />
                <Text shouldScale={false} fontSize={12} weight="regular">
                  {t(
                    'Import an account from a JSON file. The account needs to be exported from Ambire Wallet. Files exported from other wallet providers are not supported.'
                  )}
                </Text>
              </View>
              <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mb]}>
                <Button
                  textStyle={{ fontSize: 14 }}
                  accentColor={colors.violet}
                  text={t('View Mode')}
                  disabled // temporary disabled until we have this feature
                  type="outline"
                  hasBottomSpacing={false}
                  style={[{ minWidth: 190 }, spacings.mrMd]}
                />
                <Text shouldScale={false} fontSize={12} weight="regular">
                  {t(
                    'Import an account in view-only mode, only via the address. You can import multiple at once.'
                  )}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </AuthLayoutWrapperMainContent>
  )
}

export default GetStartedScreen
