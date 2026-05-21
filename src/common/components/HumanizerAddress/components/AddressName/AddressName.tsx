import React, { FC, useEffect, useMemo } from 'react'
import { View } from 'react-native'

import BaseAddress from '@common/components/HumanizerAddress/components/BaseAddress'
import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import flexbox from '@common/styles/utils/flexbox'

import EnsProfilePicture from './EnsProfilePicture'

interface Props extends TextProps {
  address: string
  chainId: bigint
  actionsMode?: 'tooltip' | 'inline'
  fallbackLabel?: string
  hideLinks?: boolean
}

const AddressName: FC<Props> = ({
  address,
  chainId,
  actionsMode = 'tooltip',
  fallbackLabel,
  hideLinks,
  ...rest
}) => {
  const { name, isLoading, type } = useReverseLookup({ address })
  const {
    state: { contractNames },
    dispatch: contractNamesDispatch
  } = useController('ContractNamesController')

  const contract = useMemo(() => {
    return contractNames[address]
  }, [address, contractNames])

  const contractName = useMemo(() => {
    return contract?.name
  }, [contract])

  useEffect(() => {
    if (contractName) return

    contractNamesDispatch({
      type: 'method',
      params: {
        method: 'getName',
        args: [address, chainId]
      }
    })
  }, [contractNamesDispatch, address, chainId, contractName])

  if (isLoading && !fallbackLabel) return <Spinner style={{ width: 16, height: 16 }} />

  const shouldShowEnsProfilePicture = actionsMode === 'inline' && type === 'ens' && !!name

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, { maxWidth: '100%' }]}>
      <EnsProfilePicture address={address} shouldShow={shouldShowEnsProfilePicture} />
      <BaseAddress
        address={address}
        hideLinks={hideLinks}
        isDisplayingPlainAddress={!name && !fallbackLabel && !contractName}
        actionsMode={actionsMode}
        chainId={chainId}
        {...rest}
      >
        {name || fallbackLabel || contractName || address}
      </BaseAddress>
    </View>
  )
}

export default React.memo(AddressName)
