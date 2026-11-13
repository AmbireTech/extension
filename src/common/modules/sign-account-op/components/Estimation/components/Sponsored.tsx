import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AMBIRE_SPONSOR } from '@ambire-common/consts/sponsors'
import { Sponsor } from '@ambire-common/libs/erc7677/types'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import ManifestImage from '@common/components/ManifestImage'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest

const SPONSOR_ICON_SIZE = 64

const Sponsored = ({ sponsor, isOneClick }: { sponsor?: Sponsor; isOneClick?: boolean }) => {
  const { t } = useTranslation()
  const { state: currentUserRequest } = useController(
    'RequestsController',
    selectCurrentUserRequest
  )
  const { theme } = useTheme()
  // Shown from the app's own logo, so it needs no network request. Matching the URL trusts it no
  // more than loading it did: any sponsor that sends it got the same Ambire logo either way
  const isAmbireSponsor = sponsor?.icon === AMBIRE_SPONSOR.icon

  const iconContainerStyle = useMemo(
    () => [
      { backgroundColor: theme.secondaryBackground, flexShrink: 0 },
      isOneClick && spacings.mbTy
    ],
    [theme.secondaryBackground, isOneClick]
  )

  return (
    <View
      style={[
        flexbox.alignCenter,
        !isOneClick ? [flexbox.directionRow, spacings.pt] : spacings.pvXl
      ]}
    >
      {isAmbireSponsor ? (
        <View
          style={[
            {
              width: SPONSOR_ICON_SIZE,
              height: SPONSOR_ICON_SIZE,
              borderRadius: SPONSOR_ICON_SIZE / 2
            },
            flexbox.alignCenter,
            flexbox.justifyCenter,
            iconContainerStyle
          ]}
        >
          {/* Sized like the symbol inside the remote SVG it replaces */}
          <AmbireLogo width={29} height={44} />
        </View>
      ) : (
        <ManifestImage
          uri={sponsor?.icon || currentUserRequest?.dappPromises?.[0]?.session.icon || ''}
          size={SPONSOR_ICON_SIZE}
          isRound
          containerStyle={iconContainerStyle}
          fallback={() => <ManifestFallbackIcon width={48} height={48} />}
        />
      )}
      <View
        style={[
          isOneClick ? flexbox.alignCenter : spacings.ml,
          // Without these the row won't let this text wrap - a long dapp name (or the
          // fallback text) runs past the edge of the screen instead
          !isOneClick && { flexShrink: 1, minWidth: 0 }
        ]}
      >
        <Text fontSize={20} weight="semiBold" style={spacings.mbTy}>
          {sponsor?.name ||
            currentUserRequest?.dappPromises?.[0]?.session.name ||
            "The App you're connected to"}
        </Text>
        <Text weight="medium" appearance="secondaryText">
          {t('is sponsoring this transaction')}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(Sponsored)
