import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import { Network } from '@ambire-common/interfaces/network'
import Alert from '@common/components/Alert'
import NetworkBadge from '@common/components/NetworkBadge'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import DelegationHumanization from '@web/components/DelegationHumanization'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import SectionHeading from '@web/modules/sign-account-op/components/SectionHeading'
import TransactionSummary from '@web/modules/sign-account-op/components/TransactionSummary'

import PendingTransactionsSkeleton from './PendingTransactionsSkeleton'

interface Props {
  network?: Network
  setDelegation?: boolean
  delegatedContract?: Hex | null
}

const PendingTransactions: FC<Props> = ({ network, setDelegation, delegatedContract }) => {
  const { t } = useTranslation()
  const { humanization, banners } = useSignAccountOpControllerState() || {}

  return (
    <View style={spacings.mbLg}>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mbSm
        ]}
      >
        <SectionHeading withMb={false}>{t('Overview')}</SectionHeading>
        <NetworkBadge chainId={network?.chainId} withOnPrefix />
      </View>
      {!!banners && banners.length && (
        <View style={spacings.mbTy}>
          {banners.map((banner) => (
            <Alert
              size="sm"
              key={banner.id}
              type={banner.type}
              title={banner.text}
              titleWeight="medium"
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
            style={i !== humanization.length - 1 ? spacings.mbTy : {}}
            call={call}
            chainId={network.chainId}
            index={i}
          />
        ))
      ) : (
        <PendingTransactionsSkeleton />
      )}
    </View>
  )
}

export default React.memo(PendingTransactions)
