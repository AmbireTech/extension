import React from 'react'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter } from 'react-router-dom'

import { BenzinNetworksContextProvider } from '@benzin/contexts/benzinNetworksContext'
import { ControllersMiddlewareProvider } from '@benzin/contexts/controllersMiddlewareContext'
import BenzinScreen from '@benzin/screens/BenzinScreen'
import AmbireLogoWithText from '@common/assets/svg/AmbireLogoWithText'
import ErrorComponent from '@common/components/ErrorBoundary'
import { GlobalTooltip } from '@common/components/GlobalTooltip'
import SupportLink from '@common/components/SupportLink'
import Text from '@common/components/Text'
import { ErrorBoundary } from '@common/config/analytics/CrashAnalytics.web'
import { useTranslation } from '@common/config/localization'
import { ControllerStoreProvider } from '@common/contexts/controllerStoreContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import { PortalHost, PortalProvider } from '@gorhom/portal'

const BenzinErrorComponent = ({ error }: { error: Error }) => {
  const { t } = useTranslation()

  return (
    <ErrorComponent
      error={error}
      title={t('Could not show your transaction progress')}
      description={
        <Text fontSize={14} style={text.center}>
          {t('Reload the page or ')}
          <SupportLink label={t('contact support')} />
          {t(' if the problem persists.')}
        </Text>
      }
      logo={
        <View style={spacings.mbXl}>
          <AmbireLogoWithText width={110} height={36} />
        </View>
      }
    />
  )
}

const errorComponent = ({ error }: { error: Error }) => <BenzinErrorComponent error={error} />

const BenzinInit = () => {
  const { fontsLoaded } = useFonts()

  if (!fontsLoaded) return null

  return (
    <BrowserRouter>
      <PortalProvider>
        <GlobalTooltip />
        <SafeAreaProvider>
          <ToastProvider>
            <ErrorBoundary fallback={errorComponent as any}>
              <ControllerStoreProvider>
                <ControllersMiddlewareProvider>
                  <ThemeProvider>
                    <BenzinNetworksContextProvider>
                      <BenzinScreen />
                      <PortalHost name="global" />
                    </BenzinNetworksContextProvider>
                  </ThemeProvider>
                </ControllersMiddlewareProvider>
              </ControllerStoreProvider>
            </ErrorBoundary>
          </ToastProvider>
        </SafeAreaProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}

export default BenzinInit
