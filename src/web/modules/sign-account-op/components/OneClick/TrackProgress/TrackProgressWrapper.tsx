import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import LayoutWrapper from '@web/components/LayoutWrapper'
import { getUiType } from '@web/utils/uiType'

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

        <FooterGlassView borderRadius={28} style={{ bottom: SPACING }}>
          <View
            style={[
              routeStatus !== 'failed' ? flexbox.directionRow : flexbox.directionRowReverse,
              flexbox.alignCenter,
              !isRequestWindow ? flexbox.justifySpaceBetween : flexbox.justifyCenter
            ]}
          >
            {!isRequestWindow ? (
              <Button
                onPress={handleClose}
                hasBottomSpacing={false}
                size="smaller"
                type={routeStatus !== 'failed' ? 'secondary' : 'primary'}
                text={secondaryButtonText}
                testID="track-progress-secondary-button"
                style={{ ...spacings.mrLg, minWidth: 144 }}
              />
            ) : (
              <View />
            )}
            <Button
              onPress={onPrimaryButtonPress}
              hasBottomSpacing={false}
              style={{ width: isRequestWindow ? 160 : 104 }}
              text={t('Close')}
              size="smaller"
              type={routeStatus !== 'failed' ? 'primary' : 'secondary'}
              testID="track-progress-primary-button"
            />
          </View>
        </FooterGlassView>
      </View>
    </LayoutWrapper>
  )
}

export default TrackProgressWrapper
