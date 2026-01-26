import React, { FC, useEffect, useRef, useState } from 'react'
import { Animated, ViewStyle } from 'react-native'

import useDomainsContext from '@common/hooks/useDomainsContext'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'
import { AvatarType } from '@web/extension-services/background/controllers/wallet-state'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useWalletStateController from '@web/hooks/useWalletStateController'

import Blockie from './Blockies/Blockies'
import EnsAvatar from './EnsAvatar'
import JazzIcon from './Jazz'
import Polycons from './Polycons/Polycons'
import TypeBadge from './TypeBadge'

interface Props {
  /**
   * A custom profile picture URL to use as an avatar.
   * (Overrides the global avatar settings)
   *
   * Note: not implemented at the moment
   */
  pfp: string
  /**
   * The address of the user - used to generate the avatar
   */
  address: string
  isSmart: boolean
  size?: number
  style?: ViewStyle
  showTooltip?: boolean
  /**
   * Allow selecting a specific avatar type, overwriting the global settings.
   */
  avatarType?: Omit<AvatarType, 'ens'>
  displayTypeBadge?: boolean
}

const Avatar: FC<Props> = ({
  pfp,
  address,
  isSmart,
  size = 40,
  avatarType: propAvatarType,
  style = {},
  showTooltip = false,
  displayTypeBadge = true
}) => {
  // the ENS avatar may point to an image that no longer exists or just fails to load
  // In that case we must fallback to the next avatar type
  const [ensAvatarImageFetchFailed, setEnsAvatarImageFetchFailed] = useState(false)
  // ENS Avatar
  const { domains, loadingAddresses } = isExtension
    ? useDomainsControllerState()
    : useDomainsContext().state
  // There is no wallet controller state in benzin/rewards so we need to be careful
  const walletState = useWalletStateController()
  const avatarTypeSetting = propAvatarType || walletState?.avatarType || 'jazzicons'

  const isEnsLoading = address
    ? (domains && !domains[address]) || loadingAddresses?.includes(address)
    : false
  const ensAvatar =
    address && !ensAvatarImageFetchFailed ? domains?.[address]?.ensAvatar : undefined
  // Determine avatar type and props
  const avatarType = ensAvatar ? 'ens' : avatarTypeSetting
  const borderRadius = size / 2

  // Pulsating animation
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (isEnsLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          })
        ])
      )
      pulse.start()
      return () => pulse.stop()
    }

    pulseAnim.setValue(1)
  }, [isEnsLoading, pulseAnim])

  return (
    <Animated.View
      style={[
        spacings.prTy,
        flexbox.alignCenter,
        flexbox.justifyCenter,
        style,
        { opacity: pulseAnim }
      ]}
    >
      {avatarType === 'jazzicons' && (
        <JazzIcon borderRadius={borderRadius} address={address} size={size} />
      )}
      {avatarType === 'blockies' && (
        <Blockie seed={address} width={size} height={size} borderRadius={borderRadius} />
      )}
      {avatarType === 'ens' && !!ensAvatar && (
        <EnsAvatar
          size={size}
          avatar={ensAvatar}
          borderRadius={borderRadius}
          setImageFetchFailed={setEnsAvatarImageFetchFailed}
        />
      )}
      {avatarType === 'polycons' && (
        <Polycons address={address} size={size} borderRadius={borderRadius} />
      )}
      {displayTypeBadge && (
        <TypeBadge
          isSmart={isSmart}
          size={size >= 40 ? 'big' : 'small'}
          showTooltip={showTooltip}
        />
      )}
    </Animated.View>
  )
}

export default Avatar
