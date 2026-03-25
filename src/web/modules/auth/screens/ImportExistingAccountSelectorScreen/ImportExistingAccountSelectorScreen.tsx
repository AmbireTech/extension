import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, ScrollView, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import DiagonalRightArrowIcon from '@common/assets/svg/DiagonalRightArrowIcon'
import ImportJsonIcon from '@common/assets/svg/ImportJsonIcon'
import LatticeWithBorderIcon from '@common/assets/svg/LatticeWithBorderIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import PrivateKeyIcon from '@common/assets/svg/PrivateKeyIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SafeIcon from '@common/assets/svg/SafeIcon'
import SeedPhraseIcon from '@common/assets/svg/SeedPhraseIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { isSafari } from '@web/constants/browserapi'

import getStyles from './styles'

export const CARD_WIDTH = 400
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
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: hexToRgba(theme.secondaryBackground, 0),
        to: theme.secondaryBackground
      },
      {
        property: 'translateX',
        from: 0,
        to: showMore ? -2 : 2
      },
      {
        property: 'translateY',
        from: 0,
        to: 2
      }
    ]
  })

  const buttons: ButtonType[] = useMemo(
    () => [
      {
        title: 'Private key',
        onPress: () => {
          goToNextRoute(WEB_ROUTES.importPrivateKey)
        },
        icon: PrivateKeyIcon
      },
      {
        title: 'Recovery phrase',
        onPress: () => {
          goToNextRoute(WEB_ROUTES.importSeedPhrase)
        },
        icon: SeedPhraseIcon
      },
      {
        title: 'Trezor',
        onPress: () => {
          if (isSafari()) {
            addToast(
              t(
                "Your browser doesn't support WebUSB, which is required for the Trezor device. Please try using a different browser."
              ),
              { type: 'error' }
            )
          } else {
            setTriggeredHwWalletFlow('trezor')
            dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR' })
          }
        },
        icon: TrezorLockIcon
      },
      {
        title: 'Ledger',
        onPress: () => {
          goToNextRoute(WEB_ROUTES.ledgerConnect)
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
        title: 'Safe',
        onPress: () => {
          goToNextRoute(WEB_ROUTES.safeImport)
        },
        icon: SafeIcon
      },
      {
        title: 'QR-based',
        onPress: () => {
          goToNextRoute(WEB_ROUTES.qrConnect)
        },
        icon: ReceiveIcon
      },
      {
        title: 'JSON backup file',
        onPress: () => {
          goToNextRoute(WEB_ROUTES.importSmartAccountJson)
        },
        icon: ImportJsonIcon
      }
    ],
    [goToNextRoute, addToast, dispatch, t, setTriggeredHwWalletFlow]
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
      useNativeDriver: false
    }).start()
  }, [animatedHeight, animatedOpacity, showMore, buttons.length])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent wrapperRef={wrapperRef} contentContainerStyle={spacings.mbLg}>
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
              <AnimatedPressable
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
                    backgroundColor: animStyle.backgroundColor
                  }
                ]}
                {...bindAnim}
              >
                <Text appearance="tertiaryText" style={spacings.mrMi} fontSize={14} weight="medium">
                  {t(showMore ? 'Less' : 'More')}
                </Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateX: animStyle.translateX as any
                      },
                      {
                        translateY: animStyle.translateY as any
                      }
                    ]
                  }}
                >
                  <DiagonalRightArrowIcon
                    color={theme.iconPrimary}
                    height={20}
                    width={20}
                    style={{
                      transform: [{ rotate: showMore ? '270deg' : '0deg' }]
                    }}
                  />
                </Animated.View>
              </AnimatedPressable>
            )}
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(ImportExistingAccountSelectorScreen)
