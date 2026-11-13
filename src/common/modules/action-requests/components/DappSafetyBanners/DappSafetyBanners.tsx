import React from 'react'
import { View, ViewStyle } from 'react-native'

import { DappVerificationBanner } from '@ambire-common/interfaces/dapp'
import SafetyChecksBanner from '@common/modules/sign-account-op/components/SafetyChecksBanner'
import spacings from '@common/styles/spacings'

type Props = {
  banners: DappVerificationBanner[]
  style?: ViewStyle
}

/** Scam checker warnings about the app behind a request, e.g. "Potentially harmful app" */
const DappSafetyBanners = ({ banners, style }: Props) => {
  if (!banners.length) return null

  return (
    <View style={style}>
      {banners.map((banner) => (
        <SafetyChecksBanner
          key={banner.id}
          type={banner.type}
          title={banner.title}
          text={banner.text}
          secondaryText={banner.secondaryText}
          trustableDappUrls={banner.trustableDappUrls}
          style={spacings.mbTy}
        />
      ))}
    </View>
  )
}

export default React.memo(DappSafetyBanners)
