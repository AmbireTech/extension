import React, { FC, useEffect, useMemo } from 'react'

import BaseAddress from '@common/components/HumanizerAddress/components/BaseAddress'
import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useContractNamesControllerState from '@web/hooks/useContractNamesController/useContractNamesController'

interface Props extends TextProps {
  address: string
  chainId: bigint
}

const AddressName: FC<Props> = ({ address, chainId, ...rest }) => {
  const { ens, isLoading } = useReverseLookup({ address })
  const { contractNames } = useContractNamesControllerState()
  const { dispatch } = useBackgroundService()

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
    <BaseAddress address={address} {...rest}>
      {ens || contractName || address}
    </BaseAddress>
  )
}

export default React.memo(AddressName)
