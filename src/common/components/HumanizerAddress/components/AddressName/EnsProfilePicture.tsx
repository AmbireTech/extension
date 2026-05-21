import React, { FC, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import EnsAvatar from '@common/components/Avatar/EnsAvatar'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

interface Props {
  address: string
  shouldShow: boolean
}

const EnsProfilePicture: FC<Props> = ({ address, shouldShow }) => {
  const [ensAvatarImageState, setEnsAvatarImageState] = useState<'loading' | 'loaded' | 'failed'>(
    'loading'
  )
  const checksummedAddress = useMemo(() => getAddressCaught(address), [address])
  const {
    state: { domains }
  } = useController('DomainsController')
  const ensAvatar = checksummedAddress ? domains?.[checksummedAddress]?.ensAvatar : undefined

  useEffect(() => {
    setEnsAvatarImageState('loading')
  }, [ensAvatar])

  if (!shouldShow || !ensAvatar || ensAvatarImageState === 'failed') return null

  return (
    <View style={spacings.mrMi}>
      <EnsAvatar
        avatar={ensAvatar}
        size={16}
        borderRadius={8}
        setEnsAvatarImageState={setEnsAvatarImageState}
      />
    </View>
  )
}

export default React.memo(EnsProfilePicture)
