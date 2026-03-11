import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isRequestWindow } = getUiType()

type TrackProgressProps = {
  handleClose: () => void
  onPrimaryButtonPress: () => void
  secondaryButtonText: string
  children: React.ReactNode
  routeStatus?: SwapAndBridgeActiveRoute['routeStatus']
}

const TrackProgressWrapper: FC<TrackProgressProps> = ({
  handleClose,
  onPrimaryButtonPress,
  secondaryButtonText,
  children,
  routeStatus
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const buttonsContent = (
    <View
      style={[
        routeStatus !== 'failed' ? flexbox.directionRow : flexbox.directionRowReverse,
        isMobile && { flexDirection: 'column-reverse' },
        !isMobile && flexbox.alignCenter,
        !isRequestWindow ? flexbox.justifySpaceBetween : flexbox.justifyCenter
      ]}
    >
      {!isRequestWindow ? (
        <Button
          onPress={handleClose}
          hasBottomSpacing={false}
          size={isMobile ? 'regular' : 'smaller'}
          type={routeStatus !== 'failed' ? 'secondary' : 'primary'}
          text={secondaryButtonText}
          testID="track-progress-secondary-button"
          style={{
            ...(isMobile ? {} : routeStatus !== 'failed' ? spacings.mrLg : spacings.mlLg),
            minWidth: 144
          }}
        />
      ) : (
        <View />
      )}
      <Button
        onPress={onPrimaryButtonPress}
        hasBottomSpacing={isMobile}
        style={!isMobile ? { width: isRequestWindow ? 160 : 104 } : {}}
        text={t('Close')}
        size={isMobile ? 'regular' : 'smaller'}
        type={routeStatus !== 'failed' ? 'primary' : 'secondary'}
        testID="track-progress-primary-button"
      />
    </View>
  )

  return (
    <LayoutWrapper>
      <HeaderWithLogoOnly />
      <View style={[spacings.phSm, flexbox.flex1, spacings.pbSm]}>
        <View
          style={[
            flexbox.flex1,
            flexbox.alignCenter,
            flexbox.justifyCenter,
            isRequestWindow ? {} : flexbox.flex1
          ]}
        >
          {children}
        </View>

        {!isRequestWindow && (
          <View style={{ height: 1, backgroundColor: theme.secondaryBorder, ...spacings.mvLg }} />
        )}

        <FooterGlassView absolute={false} size="sm" style={spacings.mbTy}>
          {buttonsContent}
        </FooterGlassView>
      </View>
    </LayoutWrapper>
  )
}

export default TrackProgressWrapper
