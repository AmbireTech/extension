import React from 'react'
import { View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { SvgUri } from 'react-native-svg'

import BrowserIcon from '@common/assets/svg/BrowserIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import FastImage from '@common/components/FastImage'
import colors from '@common/styles/colors'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  iconUrl: string
  size?: number
  isSearchIcon?: boolean
  isBrowserIcon?: boolean
}

const DappIcon = ({ iconUrl, size = 64, isSearchIcon, isBrowserIcon }: Props) => {
  if (isBrowserIcon)
    return (
      <View
        style={
          [
            common.borderRadiusPrimary,
            flexbox.justifyCenter,
            flexbox.alignCenter,
            { width: size, height: size, backgroundColor: colors.chetwode }
          ] as any
        }
      >
        <BrowserIcon width={18} height={18} />
      </View>
    )

  if (isSearchIcon)
    return (
      <View
        style={
          [
            common.borderRadiusPrimary,
            flexbox.justifyCenter,
            flexbox.alignCenter,
            { width: size, height: size, backgroundColor: colors.chetwode }
          ] as any
        }
      >
        <SearchIcon width={18} height={18} />
      </View>
    )

  if (!iconUrl) return <ManifestFallbackIcon width={size} height={size} />

  if (iconUrl.endsWith('.svg')) {
    return (
      <View style={[common.borderRadiusPrimary, common.hidden]}>
        <ErrorBoundary FallbackComponent={() => <ManifestFallbackIcon />}>
          <SvgUri width={size} height={size} uri={iconUrl} />
        </ErrorBoundary>
      </View>
    )
  }

  return (
    <FastImage
      style={[common.borderRadiusPrimary, { width: size, height: size }] as any}
      source={{ uri: iconUrl }}
    />
  )
}

export default DappIcon
