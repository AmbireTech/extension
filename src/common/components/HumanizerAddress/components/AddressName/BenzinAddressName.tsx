/* eslint-disable no-console */
import React, { FC, useEffect, useMemo } from 'react'

import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useContractNamesControllerState from '@web/hooks/useContractNamesController/useContractNamesController'
import useControllersMiddleware from '@web/hooks/useControllersMiddleware'

import BaseAddress from '../BaseAddress'

interface Props extends TextProps {
  address: string
  chainId: bigint
}

const BenzinAddressName: FC<Props> = ({ address, chainId, ...rest }) => {
  const { isLoading: isLoadingEns, ens } = useReverseLookup({ address })
  const { contractNames } = useContractNamesControllerState()
  const { dispatch } = useControllersMiddleware()

  useEffect(() => {
    if (!contractNames[address]) {
      dispatch({
        type: 'CONTRACT_NAMES_CONTROLLER_GET_NAME',
        params: { address, chainId }
      })
    }
  }, [address, chainId, contractNames, dispatch])

  const foundContractName = useMemo(() => {
    const name = contractNames?.[address]?.name
    if (!name) return
    return name
  }, [contractNames, address])

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
