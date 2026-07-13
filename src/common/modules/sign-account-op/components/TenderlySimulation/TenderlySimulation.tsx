import React, { useMemo } from 'react'

import TenderlyLogo from '@common/assets/svg/TenderlyLogo'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { getTenderlySimulationLink } from '@common/modules/sign-account-op/helpers/tenderlySimulation'

import TenderlySimulationLink from '../TenderlySimulationLink'

const TenderlySimulation = () => {
  const { t } = useTranslation()
  const signAccountOpState = useController('SignAccountOpController').state
  const { accountStates } = useController('AccountsController').state

  const state = useMemo(() => {
    if (!signAccountOpState) return undefined
    return accountStates[signAccountOpState.accountOp.accountAddr]?.[
      signAccountOpState.accountOp.chainId.toString()
    ]
  }, [signAccountOpState, accountStates])

  const tenderlyLink = useMemo(() => {
    return getTenderlySimulationLink({
      signAccountOpState,
      state
    })
  }, [signAccountOpState, state])

  return (
    <TenderlySimulationLink
      tenderlyLink={tenderlyLink}
      text={t('Simulate in')}
      renderIcon={<TenderlyLogo width={100} height={36} />}
    />
  )
}

export default React.memo(TenderlySimulation)
