import React, { FC } from 'react'
import { useWindowDimensions, View } from 'react-native'

import { EIP7702Auth } from '@ambire-common/consts/7702'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import { StepsData } from '@benzin/screens/BenzinScreen/hooks/useSteps'
import { ActiveStepType } from '@benzin/screens/BenzinScreen/interfaces/steps'
import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import StarsIcon from '@common/assets/svg/StarsIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import DelegationHumanization from '@web/components/DelegationHumanization'

import Step from './components/Step'
import { getFee, getFinalizedRows, getTimestamp, shouldShowTxnProgress } from './utils/rows'

interface Props {
  activeStep: ActiveStepType
  txnId: string | null
  userOpHash: string | null
  stepsState: StepsData
  summary: any
  delegation?: EIP7702Auth
}

const Steps: FC<Props> = ({ activeStep, txnId, userOpHash, stepsState, summary, delegation }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()
  const { blockData, finalizedStatus, feePaidWith, from, originatedFrom } = stepsState
  const finalStepRows: any = getFinalizedRows(blockData, finalizedStatus)

  const stepRows: any = [
    {
      label: 'Timestamp',
      value: getTimestamp(blockData, finalizedStatus)
    },
    {
      label: 'Transaction fee',
      // Render a specific element in case the fee was paid with an ERC20 token
      renderValue: () =>
        feePaidWith?.isErc20 || feePaidWith?.isSponsored ? (
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.mlTy,
              spacings.pvMi,
              spacings.phSm,
              {
                backgroundColor: '#6000FF14',
                borderRadius: 20,
                width: 'fit-content'
              }
            ]}
          >
            <StarsIcon width={14} height={14} />
            {feePaidWith.isSponsored ? (
              <Text style={spacings.mlTy} appearance="primary" weight="medium" fontSize={12}>
                Sponsored
              </Text>
            ) : (
              <>
                <Text style={spacings.mlTy} appearance="primary" weight="medium" fontSize={12}>
                  Paid with {feePaidWith.amount}
                </Text>
                <TokenIcon
                  containerStyle={{ marginLeft: 4 }}
                  address={feePaidWith.address}
                  chainId={feePaidWith.chainId}
                  containerHeight={32}
                  containerWidth={32}
                  width={18}
                  height={18}
                  withNetworkIcon={false}
                />
                <Text style={spacings.mlMi} appearance="primary" weight="medium" fontSize={12}>
                  {feePaidWith.symbol} ({feePaidWith.usdValue})
                </Text>
              </>
            )}
          </View>
        ) : null,
      value:
        !feePaidWith?.isErc20 && !feePaidWith?.isSponsored
          ? getFee(feePaidWith, finalizedStatus)
          : null
    }
  ]

  if (originatedFrom) {
    if (from)
      stepRows.push({
        label: 'Sender',
        value: from
      })
    if (from !== originatedFrom)
      finalStepRows.push({
        label: 'Originated from',
        value: originatedFrom,
        collapsedByDefault: true
      })
  }

  if (txnId) {
    finalStepRows.push({
      label: 'Transaction ID',
      value: txnId,
      isValueSmall: true,
      collapsedByDefault: true
    })
  }

  if (userOpHash) {
    finalStepRows.push({
      label: 'User Op ID',
      value: userOpHash,
      isValueSmall: true,
      collapsedByDefault: true
    })
  }

  const isFinalized = activeStep === 'finalized'
  const showConfetti =
    isFinalized && finalizedStatus !== null && finalizedStatus.status === 'confirmed'

  return (
    <>
      {showConfetti && (
        <ConfettiAnimation
          type="tertiary"
          width={windowWidth}
          height={windowHeight}
          autoPlay
          loop={false}
          style={{ zIndex: 1 }}
        />
      )}
      <View style={IS_MOBILE_UP_BENZIN_BREAKPOINT ? spacings.mb3Xl : spacings.mbXl}>
        <Step
          title="Signed"
          stepName="signed"
          activeStep={activeStep}
          finalizedStatus={finalizedStatus}
          rows={stepRows}
          testID="signed-step"
        />
        {shouldShowTxnProgress(finalizedStatus) && (
          <Step
            title={isFinalized ? 'Transaction details' : 'Your transaction is in progress'}
            stepName="in-progress"
            activeStep={activeStep}
            finalizedStatus={finalizedStatus}
            testID="txn-progress-step"
          >
            {!delegation && !!summary && summary}
            {delegation && (
              <DelegationHumanization
                setDelegation={delegation.address !== ZERO_ADDRESS}
                delegatedContract={delegation.address}
              />
            )}
            {
              // if there's an userOpHash & txnId but no callData decoded,
              // it means handleOps has not been called directly and we cannot decode
              // the data correctly
              txnId &&
                userOpHash &&
                stepsState.userOp &&
                stepsState.userOp.callData === '' &&
                !stepsState.extensionAccOp &&
                stepsState.finalizedStatus?.status !== 'fetching' && (
                  <Text appearance="errorText" fontSize={14}>
                    Could not decode calldata. Open the explorer for a better summarization
                  </Text>
                )
            }
          </Step>
        )}
        <Step
          // We want to show the user the positive outcome of the transaction while it is still in progress
          title={finalizedStatus && finalizedStatus.status ? finalizedStatus.status : 'Confirmed'}
          testID="finalized-rows"
          stepName="finalized"
          finalizedStatus={finalizedStatus}
          activeStep={activeStep}
          style={spacings.pb0}
          rows={isFinalized ? finalStepRows : []}
          collapsibleRows={isFinalized}
          titleStyle={!isFinalized ? spacings.mb0 : undefined}
        />
      </View>
    </>
  )
}

export default React.memo(Steps)
