import React, { FC, useEffect, useRef, useState } from 'react'
import { Animated, Image, View, ViewStyle } from 'react-native'

import { isValidAddress } from '@ambire-common/services/address'
import avatarAstronautMan from '@common/assets/images/avatars/avatar-astronaut-man.png'
import avatarAstronautWoman from '@common/assets/images/avatars/avatar-astronaut-woman.png'
import avatarFire from '@common/assets/images/avatars/avatar-fire.png'
import avatarPlanet from '@common/assets/images/avatars/avatar-planet.png'
import avatarSpaceDog from '@common/assets/images/avatars/avatar-space-dog.png'
import avatarSpaceRaccoon from '@common/assets/images/avatars/avatar-space-raccoon.png'
import avatarSpace from '@common/assets/images/avatars/avatar-space.png'
import avatarSpreadFire from '@common/assets/images/avatars/avatar-spread-fire.png'
import useDomainsContext from '@common/hooks/useDomainsContext'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getAvatarType } from '@common/utils/avatars'
import { isExtension } from '@web/constants/browserapi'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'

import Blockie from './Blockies/Blockies'
import EnsAvatar from './EnsAvatar'
import JazzIcon from './Jazz'
import TypeBadge from './TypeBadge'

export {
  avatarAstronautMan,
  avatarAstronautWoman,
  avatarFire,
  avatarPlanet,
  avatarSpaceDog,
  avatarSpaceRaccoon,
  avatarSpace,
  avatarSpreadFire
}

export const BUILD_IN_AVATAR_ID_PREFIX = 'AMBIRE-BUILD-IN-AVATAR-'

export const buildInAvatars = [
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}1`, source: avatarAstronautMan },
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}2`, source: avatarAstronautWoman },
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}3`, source: avatarFire },
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}4`, source: avatarPlanet },
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}5`, source: avatarSpaceDog },
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}6`, source: avatarSpaceRaccoon },
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}7`, source: avatarSpace },
  { id: `${BUILD_IN_AVATAR_ID_PREFIX}8`, source: avatarSpreadFire }
]

const DEFAULT_AVATAR = buildInAvatars[0]
export const getAccountPfpSource = (pfpId: string) => {
  // address for the Blockie
  if (isValidAddress(pfpId)) return pfpId

  return buildInAvatars.find(({ id }) => id === pfpId)?.source || DEFAULT_AVATAR!.source
}

interface Props {
  pfp: string
  address: string
  isSmart: boolean
  size?: number
  style?: ViewStyle
  showTooltip?: boolean
  displayTypeBadge?: boolean
}

const Avatar: FC<Props> = ({
  pfp,
  address,
  isSmart,
  size = 40,
  style = {},
  showTooltip = false,
  displayTypeBadge = true
}) => {
  // the ENS avatar may point to an image that no longer exists or just fails to load
  // In that case we must fallback to the next avatar type
  const [ensAvatarImageFetchFailed, setEnsAvatarImageFetchFailed] = useState(false)
  const selectedAccountPfp = getAccountPfpSource(pfp)
  // ENS Avatar
  const { domains, loadingAddresses } = isExtension
    ? useDomainsControllerState()
    : useDomainsContext().state

  const isEnsLoading = address
    ? (domains && !domains[address]) || loadingAddresses?.includes(address)
    : false
  const ensAvatar =
    address && !ensAvatarImageFetchFailed ? domains?.[address]?.ensAvatar : undefined
  // Determine avatar type and props
  const avatarType = getAvatarType(selectedAccountPfp, ensAvatar)
  const borderRadius = size / 2
  const badgeSize = size >= 40 ? 'big' : 'small'

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
      {avatarType === 'jazz' && (
        <JazzIcon borderRadius={borderRadius} address={selectedAccountPfp} size={size} />
      )}
      {avatarType === 'blockies' && (
        <Blockie seed={selectedAccountPfp} width={size} height={size} borderRadius={borderRadius} />
      )}
      {avatarType === 'ens' && !!ensAvatar && (
        <EnsAvatar
          size={size}
          avatar={ensAvatar}
          borderRadius={borderRadius}
          setImageFetchFailed={setEnsAvatarImageFetchFailed}
        />
      )}
      {avatarType === 'legacy' && (
        <Image
          // @ts-ignore
          source={selectedAccountPfp}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="contain"
        />
      )}
      {displayTypeBadge && (
        <TypeBadge isSmart={isSmart} size={badgeSize} showTooltip={showTooltip} />
      )}
    </Animated.View>
  )
}

export default Avatar
