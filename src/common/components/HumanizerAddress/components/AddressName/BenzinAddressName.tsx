/* eslint-disable no-console */
import React, { FC, useEffect, useMemo } from 'react'

import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useContractNamesContext from '@common/hooks/useContractNamesContext/useContractNamesContext'
import useReverseLookup from '@common/hooks/useReverseLookup'

import BaseAddress from '../BaseAddress'

interface Props extends TextProps {
  address: string
  chainId: bigint
}

const BenzinAddressName: FC<Props> = ({ address, chainId, ...rest }) => {
  const { isLoading: isLoadingEns, ens } = useReverseLookup({ address })
  const { contractNamesCtrl, state } = useContractNamesContext()

  useEffect(() => {
    if (!contractNamesCtrl.contractNames?.[address]) contractNamesCtrl.getName(address, chainId)
  }, [address, chainId, contractNamesCtrl])

  const foundContractName = useMemo(() => {
    const name = state.contractNames?.[address]?.name
    if (!name) return
    return name
  }, [state, address])

  if (isLoadingEns)
    return (
      <Spinner
        style={{
          width: 16,
          height: 16
        }}
      />
    )

  return (
    <BaseAddress address={address} {...rest}>
      {ens || foundContractName || address}
    </BaseAddress>
  )
}

export default BenzinAddressName
