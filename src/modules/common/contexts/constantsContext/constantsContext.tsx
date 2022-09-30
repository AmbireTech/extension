import useConstants, { UseConstantsReturnType } from 'ambire-common/src/hooks/useConstants'
import * as SplashScreen from 'expo-splash-screen'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Satellite from '@assets/svg/Satellite'
import CONFIG from '@config/env'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import Spinner from '@modules/common/components/Spinner'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'

const ConstantsContext = createContext<{
  constants: UseConstantsReturnType['constants']
}>({
  constants: null
})

const ConstantsProvider: React.FC = ({ children }) => {
  const { t } = useTranslation()
  const { constants, isLoading, retryFetch, hasError } = useConstants({
    fetch,
    endpoint: CONFIG.CONSTANTS_ENDPOINT
  })
  const [isRetrying, setIsRetrying] = useState<boolean>(false)

  useEffect(() => {
    if (hasError) {
      SplashScreen.hideAsync()
    }
  }, [hasError])

  const retry = useCallback(async () => {
    setIsRetrying(true)
    await retryFetch()

    setIsRetrying(false)
  }, [retryFetch])

  const ErrorView = useMemo(
    () => (
      <GradientBackgroundWrapper>
        <Wrapper contentContainerStyle={flexboxStyles.center}>
          <Satellite style={spacings.mbLg} />
          <Title style={textStyles.center}>{t("Can't connect to our server")}</Title>
          <Text style={[spacings.mb, spacings.mhTy, textStyles.center]}>
            {t('Something went wrong, but your funds are safe! Please try again later.')}
          </Text>
          <Button
            text={isRetrying ? t('Retrying...') : t('Retry')}
            disabled={isRetrying}
            onPress={retry}
          />
        </Wrapper>
      </GradientBackgroundWrapper>
    ),
    [t, isRetrying, retry]
  )

  const render = useCallback(() => {
    // In the mobile app context - there is no need for another (custom)
    // loading view, because the splash screen will always be present
    // while this provider is loading (so it can be `null`)
    // In the web extension context - a (custom) loading view is needed,
    // because there is no splash screen present there. So keep it.
    const LoadingView = (
      <GradientBackgroundWrapper>
        <Wrapper contentContainerStyle={flexboxStyles.center}>
          <Spinner />
        </Wrapper>
      </GradientBackgroundWrapper>
    )

    if (isLoading) {
      return LoadingView
    }

    return hasError ? ErrorView : children
  }, [isLoading, hasError, ErrorView, children])

  return (
    <ConstantsContext.Provider value={useMemo(() => ({ constants }), [constants])}>
      {render()}
    </ConstantsContext.Provider>
  )
}

export { ConstantsContext, ConstantsProvider }
