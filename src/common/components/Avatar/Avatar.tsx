import React, { FC, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import useDomainsContext from '@common/hooks/useDomainsContext'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getAvatarType } from '@common/utils/avatars'
import { isExtension } from '@web/constants/browserapi'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useWalletStateController from '@web/hooks/useWalletStateController'

import Blockie from './Blockies/Blockies'
import EnsAvatar from './EnsAvatar'
import JazzIcon from './Jazz'
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
  // ENS Avatar
  const { domains, loadingAddresses } = isExtension
    ? useDomainsControllerState()
    : useDomainsContext().state
  const walletState = useWalletStateController()
  const avatarTypeSetting = walletState.avatarType || 'jazzicon'

  const isEnsLoading = address
    ? (domains && !domains[address]) || loadingAddresses?.includes(address)
    : false
  const ensAvatar = address ? domains?.[address]?.ensAvatar : undefined
  const shouldLoadEns = (isEnsLoading || !!ensAvatar) && !ensAvatarImageFetchFailed
  // Determine avatar type and props
  const avatarType = getAvatarType(avatarTypeSetting, shouldLoadEns)
  const borderRadius = size / 2

  return (
    <View style={[spacings.prTy, flexbox.alignCenter, flexbox.justifyCenter, style]}>
      {avatarType === 'jazzicon' && (
        <JazzIcon borderRadius={borderRadius} address={address} size={size} />
      )}
      {avatarType === 'blockies' && (
        <Blockie seed={address} width={size} height={size} borderRadius={borderRadius} />
      )}
      {avatarType === 'ens' && (
        <EnsAvatar
          isLoading={isEnsLoading}
          avatar={ensAvatar ?? undefined}
          size={size}
          borderRadius={borderRadius}
          setImageFetchFailed={setEnsAvatarImageFetchFailed}
        />
      )}
      {displayTypeBadge && (
        <TypeBadge
          isSmart={isSmart}
          size={size >= 40 ? 'big' : 'small'}
          showTooltip={showTooltip}
        />
      )}
    </View>
  )
}

export default Avatar
