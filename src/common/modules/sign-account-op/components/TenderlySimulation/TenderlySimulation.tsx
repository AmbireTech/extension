import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import TenderlyLogo from '@common/assets/svg/TenderlyLogo'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { getTenderlySimulationLink } from '@common/modules/sign-account-op/helpers/tenderlySimulation'

import TenderlySimulationLink from '../TenderlySimulationLink'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  style?: ViewStyle
}

const selectAccountStates = (state: AllControllersMappingType['AccountsController']) =>
  state.accountStates

const TenderlySimulation = ({ style }: Props) => {
  const { t } = useTranslation()
  const signAccountOpState = useController('SignAccountOpController').state
  const { state: accountStates } = useController('AccountsController', selectAccountStates)

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
      text={t('Simulate in Tenderly')}
      renderIcon={<TenderlyLogo />}
      style={style}
    />
  )
}

export default React.memo(TenderlySimulation)
