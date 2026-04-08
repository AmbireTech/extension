import React, { FC } from 'react'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import useReverseLookup from '@common/hooks/useReverseLookup'

import styles from './Address.module.scss'

type Props = {
  address: string
  maxAddressLength?: number
  skeletonClassName?: string
  className?: string
}

const Address: FC<Props> = ({ address, className, skeletonClassName, maxAddressLength }) => {
  const { isLoading, name } = useReverseLookup({ address })
  const shortenedAddress = maxAddressLength ? shortenAddress(address, maxAddressLength) : address

  if (isLoading) {
    return <div className={`${styles.skeleton} ${className} ${skeletonClassName}`} />
  }

  return <span className={`${styles.address} ${className}`}>{name || shortenedAddress}</span>
}

export default Address
