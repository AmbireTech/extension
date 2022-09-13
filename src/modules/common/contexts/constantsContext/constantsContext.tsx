import useFetchConstants, { ConstantsType } from 'ambire-common/src/hooks/useFetchConstants'
import React, { createContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import Satellite from '@assets/svg/Satellite'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import SafeAreaView from '@modules/common/components/SafeAreaView'
import Spinner from '@modules/common/components/Spinner'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper from '@modules/common/components/Wrapper'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'

const ConstantsContext = createContext<{
  constants: ConstantsType | null
  isLoading: boolean
}>({
  constants: null,
  isLoading: true
})

const ConstantsProvider: React.FC = ({ children }) => {
  const { t } = useTranslation()
  const { constants, isLoading } = useFetchConstants({ fetch })
  // TODO: wire up
  const hasError = false

  const ErrorView = (
    <GradientBackgroundWrapper>
      <Wrapper contentContainerStyle={flexboxStyles.center}>
        <Satellite style={spacings.mbLg} />
        <Title style={textStyles.center}>{t("Can't connect to our server")}</Title>
        <Text style={[spacings.mb, spacings.mhTy, textStyles.center]}>
          {t('Something went wrong, but your funds are safe! Please try again later.')}
        </Text>
      </Wrapper>
    </GradientBackgroundWrapper>
  )

  return (
    <ConstantsContext.Provider
      value={useMemo(() => ({ constants, isLoading }), [constants, isLoading])}
    >
      {isLoading ? (
        <SafeAreaView style={[flexboxStyles.center, flexboxStyles.flex1]}>
          <Spinner />
        </SafeAreaView>
      ) : hasError ? (
        ErrorView
      ) : (
        children
      )}
    </ConstantsContext.Provider>
  )
}

export { ConstantsContext, ConstantsProvider }
