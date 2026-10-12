import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { restart, useStallionUpdate } from 'react-native-stallion'

import NewsletterIcon from '@common/assets/svg/NewsletterIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import TosIcon from '@common/assets/svg/TosIcon'
import Banner from '@common/components/Banner'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { APP_VERSION, BUILD_NUMBER, isDev } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { openInTab } from '@common/utils/links'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import AmbireNextSheet from '@mobile/modules/settings/components/AmbireNextSheet'
import { getIsAmbireNextJoined, leaveAmbireNext } from '@mobile/services/ambireNext/ambireNext'

// Ambire Next is hidden, like Android's developer options: tapping the version row
// this many times in a row opens it.
const AMBIRE_NEXT_SECRET_TAPS = 7
// A longer pause between two taps starts the count over
const AMBIRE_NEXT_SECRET_TAPS_MAX_GAP_MS = 1000

const AboutSettingsScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { addToast } = useToast()
  const { currentlyRunningBundle, isRestartRequired, newReleaseBundle } = useStallionUpdate()
  const {
    ref: ambireNextSheetRef,
    open: openAmbireNextSheet,
    close: closeAmbireNextSheet
  } = useModalize()
  const [isAmbireNextJoined, setIsAmbireNextJoined] = useState(false)
  const versionTapsRef = useRef({ count: 0, lastTapAt: 0 })

  useEffect(() => {
    let isMounted = true

    getIsAmbireNextJoined()
      .then((isJoined) => {
        if (isMounted) setIsAmbireNextJoined(isJoined)
      })
      .catch(captureException)

    return () => {
      isMounted = false
    }
  }, [])

  // Debug meta for support: which native build the user is on + whether an OTA bundle is
  // applied on top (id + version, matchable in the Stallion console). null = base build.
  const otaInfo = currentlyRunningBundle
    ? `OTA v${currentlyRunningBundle.version} · ${currentlyRunningBundle.id}`
    : 'default'

  // Mirrors the dashboard's update banner (see useOtaUpdateBanner), so whoever has just
  // joined Ambire Next can restart into the preview version right here. A required update
  // is applied through MandatoryOtaUpdateModal instead.
  const isOtaUpdateReady = isRestartRequired && !newReleaseBundle?.isMandatory

  const openTos = () => {
    navigate(ROUTES.settingsTerms)
  }

  const openNewsletter = async () => {
    await openInTab({ url: 'https://web3onfire.com/' })
  }

  const handleVersionPress = useCallback(() => {
    if (isAmbireNextJoined) return

    const now = Date.now()
    const taps = versionTapsRef.current
    taps.count = now - taps.lastTapAt > AMBIRE_NEXT_SECRET_TAPS_MAX_GAP_MS ? 1 : taps.count + 1
    taps.lastTapAt = now
    if (taps.count < AMBIRE_NEXT_SECRET_TAPS) return

    taps.count = 0
    openAmbireNextSheet()
  }, [isAmbireNextJoined, openAmbireNextSheet])

  const handleAmbireNextJoined = useCallback(() => setIsAmbireNextJoined(true), [])

  const handleLeaveAmbireNext = useCallback(async () => {
    try {
      await leaveAmbireNext()
      setIsAmbireNextJoined(false)
      addToast(
        t(
          'You left Ambire Next. The preview version stays on your device until the next update of the main release replaces it.'
        )
      )
    } catch (error) {
      captureException(error)
      addToast(t('Leaving Ambire Next failed. Please try again.'), { type: 'error' })
    }
  }, [addToast, t])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withScroll withBackButton title="About">
        {isOtaUpdateReady && (
          <Banner
            type="info"
            title={t('Update Available')}
            text={t(
              'A new version is ready! It will be applied on the next app restart. Restart now to update immediately.'
            )}
            buttonText={t('Restart')}
            onPress={restart}
          />
        )}
        <ControlOption
          style={spacings.mbTy}
          title={`v${APP_VERSION}${isDev ? '-dev' : ''} | build ${BUILD_NUMBER} | ${otaInfo}`}
          description={''}
          renderIcon={null}
          onPress={handleVersionPress}
        />
        {isAmbireNextJoined && (
          <ControlOption
            style={spacings.mbTy}
            title={t('Ambire Next')}
            description={t(
              'You get the preview version of Ambire Wallet, intended for early access and testing new features before the main release.'
            )}
            forceDescriptionOnMobile
            renderIcon={null}
          >
            <FatToggle isOn onToggle={handleLeaveAmbireNext} style={spacings.mr0} />
          </ControlOption>
        )}
        <ControlOption
          style={spacings.mbTy}
          title={t('Terms of Service')}
          description={t('Take a moment to review the full Terms of Service of Ambire Wallet.')}
          renderIcon={<TosIcon color={theme.primaryText} />}
          onPress={openTos}
        >
          <Pressable onPress={openTos}>
            <OpenIcon />
          </Pressable>
        </ControlOption>
        <ControlOption
          style={spacings.mbXl}
          title={t('Newsletter subscription')}
          description={t(
            'Sign up for our newsletter and be the first to know about our exciting new features and updates.'
          )}
          renderIcon={<NewsletterIcon color={theme.primaryText} />}
          onPress={openNewsletter}
        >
          <Pressable onPress={openNewsletter}>
            <OpenIcon />
          </Pressable>
        </ControlOption>
      </MobileLayoutWrapperMainContent>
      <AmbireNextSheet
        sheetRef={ambireNextSheetRef}
        closeBottomSheet={closeAmbireNextSheet}
        onJoined={handleAmbireNextJoined}
      />
    </MobileLayoutContainer>
  )
}

export default React.memo(AboutSettingsScreen)
