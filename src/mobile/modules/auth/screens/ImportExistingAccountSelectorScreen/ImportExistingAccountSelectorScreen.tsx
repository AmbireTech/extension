import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, ScrollView, TouchableOpacity, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import DiagonalRightArrowIcon from '@common/assets/svg/DiagonalRightArrowIcon'
import ImportJsonIcon from '@common/assets/svg/ImportJsonIcon'
import LatticeWithBorderIcon from '@common/assets/svg/LatticeWithBorderIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import PrivateKeyIcon from '@common/assets/svg/PrivateKeyIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SeedPhraseIcon from '@common/assets/svg/SeedPhraseIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const VISIBLE_BUTTONS_COUNT = 4

type ButtonType = {
  title: string
  onPress: () => void
  icon: React.FC<SvgProps>
}

const ImportExistingAccountSelectorScreen = () => {
  const { theme, themeType } = useTheme(getStyles)
  const { t } = useTranslation()
  const wrapperRef = useRef<View | null>(null)

  const { goToPrevRoute, goToNextRoute, setTriggeredHwWalletFlow } = useOnboardingNavigation()
  const [showMore, setShowMore] = useState(false)

  const animatedHeight = useRef(new Animated.Value(0)).current
  const animatedOpacity = useRef(new Animated.Value(0)).current
  const { dispatch } = useControllersMiddleware()

  const buttons: ButtonType[] = useMemo(
    () => [
      {
        title: 'Private key',
        onPress: () => {
          goToNextRoute(ROUTES.importPrivateKey)
        },
        icon: PrivateKeyIcon
      },
      {
        title: 'Recovery phrase',
        onPress: () => {
          goToNextRoute(ROUTES.importSeedPhrase)
        },
        icon: SeedPhraseIcon
      },
      {
        title: 'Trezor',
        onPress: () => {
          setTriggeredHwWalletFlow('trezor')
          dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR' })
        },
        icon: TrezorLockIcon
      },
      {
        title: 'Ledger',
        onPress: () => {
          goToNextRoute(ROUTES.ledgerConnect)
        },
        icon: LedgerLetterIcon
      },
      {
        title: 'Grid Plus',
        onPress: () => {
          setTriggeredHwWalletFlow('lattice')
          dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE' })
        },
        icon: LatticeWithBorderIcon
      },
      {
        title: 'JSON backup file',
        onPress: () => {
          goToNextRoute(ROUTES.importSmartAccountJson)
        },
        icon: ImportJsonIcon
      }
    ],
    [goToNextRoute, dispatch, setTriggeredHwWalletFlow]
  )

  useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: showMore ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start()

    Animated.timing(animatedHeight, {
      toValue: showMore ? (buttons.length - VISIBLE_BUTTONS_COUNT) * 70 : 0,
      duration: 300,
      useNativeDriver: true
    }).start()
  }, [animatedHeight, animatedOpacity, showMore, buttons.length])

  return (
    <MobileLayoutContainer backgroundColor={theme.secondaryBackground}>
      <MobileLayoutWrapperMainContent wrapperRef={wrapperRef} contentContainerStyle={spacings.mbLg}>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Select import method')}
        >
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            <ScrollView contentContainerStyle={[flexbox.justifySpaceBetween]}>
              {buttons
                .slice(0, VISIBLE_BUTTONS_COUNT)
                .map(({ title, onPress, icon: IconComponent }) => (
                  <Button
                    key={title}
                    type="tertiary"
                    onPress={onPress}
                    testID={`import-method-${title.toLocaleLowerCase().split(' ').join('-')}`}
                    childrenContainerStyle={{
                      ...flexbox.directionRow,
                      ...flexbox.alignCenter,
                      ...flexbox.justifySpaceBetween,
                      ...flexbox.flex1
                    }}
                  >
                    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <IconComponent width={24} height={24} color={theme.iconPrimary} />
                      <Text style={spacings.mlSm} fontSize={16} weight="medium">
                        {t(title)}
                      </Text>
                    </View>
                    <RightArrowIcon color={theme.iconPrimary} />
                  </Button>
                ))}
              <Animated.View
                style={{ height: animatedHeight, opacity: animatedOpacity, overflow: 'hidden' }}
              >
                {buttons
                  .slice(VISIBLE_BUTTONS_COUNT)
                  .map(({ title, onPress, icon: IconComponent }) => (
                    <Button
                      key={title}
                      type="tertiary"
                      onPress={onPress}
                      testID={`import-method-${title.toLocaleLowerCase().split(' ').join('-')}`}
                      childrenContainerStyle={{
                        ...flexbox.directionRow,
                        ...flexbox.alignCenter,
                        ...flexbox.justifySpaceBetween,
                        ...flexbox.flex1
                      }}
                    >
                      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                        <IconComponent width={24} height={24} color={theme.iconPrimary} />
                        <Text style={spacings.mlSm} fontSize={14} weight="medium">
                          {t(title)}
                        </Text>
                      </View>
                      <RightArrowIcon
                        {...(themeType === THEME_TYPES.DARK ? { color: theme.primaryText } : {})}
                      />
                    </Button>
                  ))}
              </Animated.View>
            </ScrollView>
            {buttons.length > VISIBLE_BUTTONS_COUNT && (
              <TouchableOpacity
                onPress={() => setShowMore(!showMore)}
                testID="show-more-btn"
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  spacings.pvMi,
                  spacings.prTy,
                  spacings.plSm,
                  {
                    borderRadius: 50,
                    alignSelf: 'center',
                    backgroundColor: theme.secondaryBackground
                  }
                ]}
              >
                <Text appearance="tertiaryText" style={spacings.mrMi} fontSize={14} weight="medium">
                  {t(showMore ? 'Less' : 'More')}
                </Text>
                <Animated.View>
                  <DiagonalRightArrowIcon
                    color={theme.iconPrimary}
                    height={20}
                    width={20}
                    style={{
                      transform: [{ rotate: showMore ? '90deg' : '0deg' }]
                    }}
                  />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>
        </Panel>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ImportExistingAccountSelectorScreen)
