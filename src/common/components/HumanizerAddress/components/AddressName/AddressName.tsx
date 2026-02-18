import React, { FC, useEffect, useMemo } from 'react'

import BaseAddress from '@common/components/HumanizerAddress/components/BaseAddress'
import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useReverseLookup from '@common/hooks/useReverseLookup'

interface Props extends TextProps {
  address: string
  chainId: bigint
}

const AddressName: FC<Props> = ({ address, chainId, ...rest }) => {
  const { ens, isLoading } = useReverseLookup({ address })
  const { contractNames } = useController('ContractNamesController').state
  const { dispatch } = useControllersMiddleware()

  const contract = useMemo(() => {
    return contractNames[address]
  }, [address, contractNames])

  const contractName = useMemo(() => {
    return contract?.name
  }, [contract])

  useEffect(() => {
    if (contractName) return

    dispatch({
      type: 'CONTRACT_NAMES_CONTROLLER_GET_NAME',
      params: { address, chainId }
    })
  }, [dispatch, address, chainId, contractName])

  if (isLoading) return <Spinner style={{ width: 16, height: 16 }} />

  return (
    <BaseAddress address={address} isDisplayingPlainAddress={!ens && !contractName} {...rest}>
      {ens || contractName || address}
    </BaseAddress>
  )
}

export default React.memo(AddressName)
