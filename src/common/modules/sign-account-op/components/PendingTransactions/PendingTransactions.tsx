import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import { Network } from '@ambire-common/interfaces/network'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import useController from '@common/hooks/useController'
import PendingTransactionsSkeleton from '@common/modules/sign-account-op/components/PendingTransactions/PendingTransactionsSkeleton'
import SafetyChecksBanner from '@common/modules/sign-account-op/components/SafetyChecksBanner'
import TransactionSummary from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings from '@common/styles/spacings'
import DelegationHumanization from '@web/components/DelegationHumanization'

interface Props {
  network?: Network
  setDelegation?: boolean
  delegatedContract?: Hex | null
  hideDeleteIcon?: boolean
  signAccountOpState?: ISignAccountOpController | null
  size?: 'sm' | 'md' | 'lg'
}

const PendingTransactions: FC<Props> = ({
  network,
  setDelegation,
  delegatedContract,
  hideDeleteIcon,
  signAccountOpState,
  size = 'lg'
}) => {
  const { t } = useTranslation()
  const controllerSignAccountOpState = useController('SignAccountOpController').state
  const { humanization, banners } = signAccountOpState || controllerSignAccountOpState || {}

  return (
    <View style={spacings.mbLg}>
      {!!banners && !!banners.length && (
        <View style={spacings.mbTy}>
          {banners.map((banner) => (
            <SafetyChecksBanner
              key={banner.id}
              type={banner.type}
              text={banner.text}
              style={spacings.mbTy}
            />
          ))}
        </View>
      )}
      {setDelegation !== undefined ? (
        <DelegationHumanization
          setDelegation={setDelegation}
          delegatedContract={delegatedContract}
        />
      ) : network && humanization?.length ? (
        humanization.map((call, i) => (
          <TransactionSummary
            key={call.id}
            style={i !== (humanization?.length || 0) - 1 ? spacings.mbTy || {} : {}}
            call={call}
            chainId={network.chainId}
            index={i}
            hideDeleteIcon={hideDeleteIcon}
            size={size}
          />
        ))
      ) : (
        <PendingTransactionsSkeleton />
      )}
    </View>
  )
}

export default React.memo(PendingTransactions)
