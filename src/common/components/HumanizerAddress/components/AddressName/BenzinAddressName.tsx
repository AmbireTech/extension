import React, { FC, useEffect, useMemo } from 'react'
import { View } from 'react-native'

import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import flexbox from '@common/styles/utils/flexbox'

import BaseAddress from '../BaseAddress'
import InlineAddressAvatar from './InlineAddressAvatar'

interface Props extends TextProps {
  address: string
  chainId: bigint
  actionsMode?: 'tooltip' | 'inline'
  fallbackLabel?: string
}

const BenzinAddressName: FC<Props> = ({
  address,
  chainId,
  actionsMode = 'tooltip',
  fallbackLabel,
  ...rest
}) => {
  const { isLoading: isLoadingEns, name } = useReverseLookup({ address })

  const {
    state: { contractNames },
    dispatch
  } = useController('ContractNamesController')

  useEffect(() => {
    if (!contractNames[address]) {
      dispatch({
        type: 'method',
        params: { method: 'getName', args: [address, chainId] }
      })
    }
  }, [address, chainId, contractNames, dispatch])

  const foundContractName = useMemo(() => {
    const name = contractNames?.[address]?.name
    if (!name) return
    return name
  }, [contractNames, address])

  if (isLoadingEns && !fallbackLabel)
    return (
      <Spinner
        style={{
          width: 16,
          height: 16
        }}
      />
    )

  const shouldShowInlineAvatar = actionsMode === 'inline'

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, { maxWidth: '100%' }]}>
      <InlineAddressAvatar address={address} shouldShow={shouldShowInlineAvatar} />
      <BaseAddress
        address={address}
        isDisplayingPlainAddress={!name && !fallbackLabel && !foundContractName}
        chainId={chainId}
        actionsMode={actionsMode}
        {...rest}
      >
        {name || fallbackLabel || foundContractName || address}
      </BaseAddress>
    </View>
  )
}

export default BenzinAddressName
