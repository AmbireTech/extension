import React, { FC, useEffect, useMemo, useState } from 'react'
import { Animated, ViewStyle } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { isBenzin, isLegends } from '@common/config/env'
import { AvatarType } from '@common/controllers/wallet-state'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import Blockie from './Blockies/Blockies'
import EnsAvatar from './EnsAvatar'
import JazzIcon from './Jazz'
import Polycons from './Polycons/Polycons'
import TypeBadge from './TypeBadge'
import useSharedPulse from './useSharedPulse'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const getAvatarType = ({
  ensAvatar,
  ensAvatarImageFetchFailed,
  avatarTypeSetting,
  propAvatarType
}: {
  ensAvatar: string | undefined | null
  ensAvatarImageFetchFailed: boolean
  avatarTypeSetting: Omit<AvatarType, 'ens'>
  propAvatarType?: Omit<AvatarType, 'ens'>
}): AvatarType | Omit<AvatarType, 'ens'> => {
  // Always use the prop avatar type if provided,
  // otherwise ENS will override it.
  if (propAvatarType) return propAvatarType

  if (ensAvatar && !ensAvatarImageFetchFailed) {
    return 'ens'
  }

  return avatarTypeSetting
}

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
  smartAccountType?: 'Ambire' | 'Safe'
  size?: number
  style?: ViewStyle
  showTooltip?: boolean
  /**
   * Allow selecting a specific avatar type, overwriting the global settings.
   *
   * Note: This will also disable ENS avatars.
   */
  avatarType?: Omit<AvatarType, 'ens'>
  displayTypeBadge?: boolean
}

const selectAvatarType = (state: AllControllersMappingType['WalletStateController']) =>
  state.avatarType

const Avatar: FC<Props> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pfp,
  address,
  smartAccountType,
  size = 40,
  avatarType: propAvatarType,
  style = {},
  showTooltip = false,
  displayTypeBadge = true
}) => {
  // the ENS avatar may point to an image that no longer exists or just fails to load
  // In that case we must fallback to the next avatar type
  const [ensAvatarImageState, setEnsAvatarImageState] = useState<'loading' | 'loaded' | 'failed'>(
    'loading'
  )
  const ensAvatarImageFetchFailed = ensAvatarImageState === 'failed'
  // ENS Avatar. Both selectors read the one address instead of the whole map, so a
  // lookup that resolves for one address does not re-render every other avatar
  const selectEnsAvatar = useMemo(
    () => (state: AllControllersMappingType['DomainsController']) => state.domains[address]?.avatar,
    [address]
  )
  const selectIsEnsLoading = useMemo(
    () => (state: AllControllersMappingType['DomainsController']) =>
      !!address && state.loadingAddresses.includes(address),
    [address]
  )
  const { state: ensAvatar } = useController('DomainsController', selectEnsAvatar)
  const { state: isEnsLoading } = useController('DomainsController', selectIsEnsLoading)
  // There is no wallet controller state in benzin/rewards, and the hook must still be
  // called there - reading its state is what decides whether it subscribes, and the
  // store answers a controller it does not have with an empty state
  const { state: walletStateAvatarType } = useController('WalletStateController', selectAvatarType)
  const usesWalletStateSetting = !isLegends && !isBenzin && !propAvatarType
  const avatarTypeSetting: AvatarType | Omit<AvatarType, 'ens'> = usesWalletStateSetting
    ? walletStateAvatarType || 'jazzicons'
    : propAvatarType || 'jazzicons'
  const avatarType = getAvatarType({
    ensAvatar,
    ensAvatarImageFetchFailed,
    avatarTypeSetting,
    propAvatarType
  })
  const borderRadius = size / 2

  // The avatar may take too long to load
  useEffect(() => {
    if (avatarType === 'ens' && ensAvatar && ensAvatarImageState === 'loading') {
      const timeout = setTimeout(() => {
        setEnsAvatarImageState('failed')
      }, 5000)

      return () => clearTimeout(timeout)
    }

    // Stop eslint from crying
    return undefined
  }, [avatarType, ensAvatar, ensAvatarImageFetchFailed, ensAvatarImageState])

  // Pulsating animation, shared by every avatar that is waiting on ENS
  const pulseAnim = useSharedPulse(isEnsLoading)

  return (
    <Animated.View
      style={[
        spacings.prTy,
        flexbox.alignCenter,
        flexbox.justifyCenter,
        style,
        // Plain number unless it is actually pulsing, so a list of avatars does not
        // build one native animated node per row for a value that never moves
        { opacity: isEnsLoading ? pulseAnim : 1 }
      ]}
    >
      {/* The skeleton is displayed while the ENS image is loading, while the whole avatar is pulsing when we don't know
      if the user has an ENS avatar or not. */}
      {!isEnsLoading && avatarType === 'ens' && ensAvatarImageState === 'loading' && (
        <SkeletonLoader
          width={size}
          height={size}
          borderRadius={borderRadius}
          appearance="secondaryBackground"
          style={{ zIndex: -1, position: 'absolute', left: 0, top: 0 }}
        />
      )}
      {avatarType === 'jazzicons' && (
        <JazzIcon borderRadius={borderRadius} address={address} size={size} />
      )}
      {avatarType === 'blockies' && (
        <Blockie
          // The address MUST be lowercase for blockies as that's what other wallets do and changing it would change the generated avatar
          seed={address.toLowerCase()}
          width={size}
          height={size}
          borderRadius={borderRadius}
        />
      )}
      {avatarType === 'ens' && !!ensAvatar && (
        <EnsAvatar
          size={size}
          avatar={ensAvatar}
          borderRadius={borderRadius}
          setEnsAvatarImageState={setEnsAvatarImageState}
        />
      )}
      {avatarType === 'polycons' && (
        <Polycons address={address} size={size} borderRadius={borderRadius} />
      )}
      {displayTypeBadge && (
        <TypeBadge
          address={address}
          smartAccountType={smartAccountType}
          size={size >= 40 ? 'big' : 'small'}
          showTooltip={showTooltip}
        />
      )}
    </Animated.View>
  )
}

export default React.memo(Avatar)
