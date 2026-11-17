import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SwapAndBridgeActiveRoute } from '@ambire-common/interfaces/swapAndBridge'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import spacings, { SPACING_TY } from '@common/styles/spacings'
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
  const { isCompactLayout, isNarrowWebLayout } = useCompactLayout()
  // On web secondary is primaryBackground, which vanishes on the flat narrow footer - tertiary is
  // the mobile secondary fill
  const secondaryButtonType = isNarrowWebLayout ? 'tertiary' : 'secondary'

  const buttonsContent = (
    <View
      style={[
        routeStatus !== 'failed' ? flexbox.directionRow : flexbox.directionRowReverse,
        flexbox.alignCenter,
        !isRequestWindow ? flexbox.justifySpaceBetween : flexbox.justifyCenter,
        // Two halves of one full-width row
        isCompactLayout && { gap: SPACING_TY }
      ]}
    >
      {!isRequestWindow ? (
        <Button
          onPress={handleClose}
          hasBottomSpacing={false}
          size={isCompactLayout ? 'regular' : 'smaller'}
          type={routeStatus !== 'failed' ? secondaryButtonType : 'primary'}
          text={secondaryButtonText}
          testID="track-progress-secondary-button"
          style={
            isCompactLayout
              ? flexbox.flex1
              : { ...(routeStatus !== 'failed' ? spacings.mrLg : spacings.mlLg), minWidth: 144 }
          }
        />
      ) : (
        // Keeps Close centered in the wide row, the compact one has nothing to center against
        !isCompactLayout && <View />
      )}
      <Button
        onPress={onPrimaryButtonPress}
        hasBottomSpacing={false}
        style={isCompactLayout ? flexbox.flex1 : { width: isRequestWindow ? 160 : 104 }}
        text={t('Close')}
        size={isCompactLayout ? 'regular' : 'smaller'}
        type={routeStatus !== 'failed' ? 'primary' : secondaryButtonType}
        testID="track-progress-primary-button"
      />
    </View>
  )

  return (
    <LayoutWrapper
      style={isRequestWindow ? { borderRadius: 0, height: '100%' } : {}}
      backgroundStyle={isRequestWindow ? spacings.pt0 : {}}
    >
      <HeaderWithLogoOnly />
      <View style={[spacings.phSm, flexbox.flex1, isWeb && spacings.pbSm]}>
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

        <FooterGlassView
          absolute={false}
          size="sm"
          style={isWeb ? spacings.mbTy : {}}
          // The full-width row of buttons needs a full-width footer, not a content-sized pill
          fullWidth={isNarrowWebLayout}
          innerContainerStyle={isNarrowWebLayout ? spacings.ph0 : undefined}
        >
          {buttonsContent}
        </FooterGlassView>
      </View>
    </LayoutWrapper>
  )
}

export default TrackProgressWrapper
