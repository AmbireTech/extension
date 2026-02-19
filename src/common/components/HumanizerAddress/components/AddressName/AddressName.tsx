import React, { FC, useEffect, useMemo } from 'react'

import BaseAddress from '@common/components/HumanizerAddress/components/BaseAddress'
import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'

interface Props extends TextProps {
  address: string
  chainId: bigint
}

const AddressName: FC<Props> = ({ address, chainId, ...rest }) => {
  const { ens, isLoading } = useReverseLookup({ address })
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

  if (isLoading) return <Spinner style={{ width: 16, height: 16 }} />

  return (
    <BaseAddress address={address} isDisplayingPlainAddress={!ens && !contractName} {...rest}>
      {ens || contractName || address}
    </BaseAddress>
  )
}

export default React.memo(AddressName)
