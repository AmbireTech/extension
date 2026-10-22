import React, { FC, useEffect, useMemo } from 'react'
import { View } from 'react-native'

import Spinner from '@common/components/Spinner'
import { Props as TextProps } from '@common/components/Text'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import flexbox from '@common/styles/utils/flexbox'

import BaseAddress from '../BaseAddress'
import InlineAddressAvatar from './InlineAddressAvatar'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props extends TextProps {
  address: string
  chainId: bigint
  hideActions?: boolean
  actionsMode?: 'tooltip' | 'inline'
  fallbackLabel?: string
  isToken?: boolean
  /** Shows only names already known locally, with no lookup that sends the address out. */
  isLocalLabelOnly?: boolean
}

const selectContractNames = (state: AllControllersMappingType['ContractNamesController']) =>
  state.contractNames

const BenzinAddressName: FC<Props> = ({
  address,
  chainId,
  hideActions = false,
  actionsMode = 'tooltip',
  fallbackLabel,
  isToken,
  isLocalLabelOnly,
  ...rest
}) => {
  const { isLoading: isLoadingEns, name } = useReverseLookup({
    address,
    privacyUpdateMode: isLocalLabelOnly ? 'never' : undefined
  })

  const { state: contractNames, dispatch } = useController(
    'ContractNamesController',
    selectContractNames
  )

  useEffect(() => {
    if (!contractNames[address] && !isLocalLabelOnly) {
      dispatch({
        type: 'method',
        params: { method: 'getName', args: [address, chainId] }
      })
    }
  }, [address, chainId, contractNames, dispatch, isLocalLabelOnly])

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
        hideActions={hideActions}
        actionsMode={actionsMode}
        isToken={isToken}
        {...rest}
      >
        {name || fallbackLabel || foundContractName || address}
      </BaseAddress>
    </View>
  )
}

export default BenzinAddressName
