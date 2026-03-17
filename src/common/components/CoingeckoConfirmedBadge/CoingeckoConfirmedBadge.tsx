import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

import { getCoinGeckoTokenApiUrl, getCoinGeckoTokenUrl } from '@ambire-common/consts/coingecko'
import { Network } from '@ambire-common/interfaces/network'
import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import CoingeckoIcon from '@common/assets/svg/CoingeckoIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { openInTab } from '@common/utils/links'

import getStyles from './styles'

type Props = {
  text: string
  containerStyle?: any
  address: CustomToken['address']
  network?: Network
}

const CoingeckoConfirmedBadge = ({ text, address, network, containerStyle }: Props) => {
  const { styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [coinGeckoTokenSlug, setCoinGeckoTokenSlug] = useState('')
  const [isTokenInfoLoading, setIsTokenInfoLoading] = useState(false)

  const onCoingeckoBadgePress = useCallback(async () => {
    try {
      await openInTab({ url: getCoinGeckoTokenUrl(coinGeckoTokenSlug) })
    } catch {
      addToast(t('Could not open token info'), { type: 'error' })
    }
  }, [addToast, coinGeckoTokenSlug, t])

  useEffect(() => {
    if (coinGeckoTokenSlug) return // already fetched
    if (!address || !network) return

    const tokenAddr = address
    const geckoChainId = network.platformId
    const geckoNativeCoinId = network.nativeAssetId
    const tokenInfoUrl = getCoinGeckoTokenApiUrl({ tokenAddr, geckoChainId, geckoNativeCoinId })

    const abortController = new AbortController()
    const signal = abortController.signal
    setIsTokenInfoLoading(true)
    fetch(tokenInfoUrl, { signal })
      .then((response) => response.json())
      .then((result) => !signal.aborted && setCoinGeckoTokenSlug(result.web_slug))
      .finally(() => !signal.aborted && setIsTokenInfoLoading(false))

    return () => abortController.abort()
  }, [addToast, t, address, network, coinGeckoTokenSlug])

  if (isTokenInfoLoading) return <Spinner style={{ width: 16, height: 16 }} />

  // Ideally, there could be an error state or something. But not displaying the badge is also fine.
  if (!coinGeckoTokenSlug) return null

  return (
    <Pressable style={[styles.container, containerStyle]} onPress={onCoingeckoBadgePress}>
      <Text weight="medium" fontSize={10} color={theme.success400} style={spacings.mrMi}>
        {text}
      </Text>
      <SuccessIcon color={theme.success400} width={20} height={20} withCirc={false} />
      <CoingeckoIcon width={20} height={20} />
    </Pressable>
  )
}

export default React.memo(CoingeckoConfirmedBadge)
