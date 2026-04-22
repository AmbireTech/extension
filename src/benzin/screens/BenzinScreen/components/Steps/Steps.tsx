import React, { FC } from 'react'
import { useWindowDimensions, View } from 'react-native'

import { EIP7702Auth } from '@ambire-common/consts/7702'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import { StepsData } from '@benzin/screens/BenzinScreen/hooks/useSteps'
import { ActiveStepType } from '@benzin/screens/BenzinScreen/interfaces/steps'
import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import StarsIcon from '@common/assets/svg/StarsIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
import PendingTokenSummary from '@common/modules/sign-account-op/components/PendingTokenSummary'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
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
  const { theme } = useTheme()
  const { blockData, finalizedStatus, feePaidWith, from, originatedFrom } = stepsState
  const finalStepRows: any = getFinalizedRows(blockData, finalizedStatus)
  const balanceChanges = stepsState.submittedAccountOp?.balanceChanges || []
  const hasBalanceChangesLoaded =
    typeof stepsState.submittedAccountOp?.balanceChanges !== 'undefined'
  const assetsOut = balanceChanges.filter((change) => change.balanceChange < 0n)
  const assetsIn = balanceChanges.filter((change) => change.balanceChange > 0n)
  const shouldShowBalanceChanges = shouldShowTxnProgress(finalizedStatus)
  const shouldRenderBalanceChangesInColumns = windowWidth > 700
  const displayActiveStep =
    activeStep === 'finalized' && shouldShowBalanceChanges && !hasBalanceChangesLoaded
      ? 'balance-changes'
      : activeStep

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
              spacings.pvMi,
              spacings.phSm,
              { backgroundColor: '#6000FF14', borderRadius: 20 },
              // @ts-ignore value missing in the props, but it's available on web
              { width: 'fit-content' }
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

  const isFinalized = displayActiveStep === 'finalized'
  const showConfetti =
    isFinalized && finalizedStatus !== null && finalizedStatus.status === 'confirmed'

  const renderBalanceChangesCard = (title: string, changes: typeof balanceChanges) => (
    <View
      style={[
        flexbox.flex1,
        {
          borderWidth: 1,
          borderColor: theme.primaryBorder,
          overflow: 'hidden',
          ...common.borderRadiusPrimary
        }
      ]}
    >
      <View
        style={[
          spacings.phSm,
          spacings.pvTy,
          {
            backgroundColor: theme.secondaryBackground
          }
        ]}
      >
        <Text fontSize={14} weight="semiBold" appearance="secondaryText">
          {title}
        </Text>
      </View>
      <View
        style={[
          flexbox.flex1,
          spacings.phSm,
          spacings.pvSm,
          {
            backgroundColor: theme.primaryBackground
          }
        ]}
      >
        {changes.map((change, index) => (
          <PendingTokenSummary
            key={change.address}
            token={{
              ...change,
              simulationAmount: change.balanceChange
            }}
            chainId={change.chainId}
            hasBottomSpacing={index < changes.length - 1}
          />
        ))}
      </View>
    </View>
  )

  return (
    <>
      {!!showConfetti && (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
          pointerEvents="none"
        >
          <ConfettiAnimation
            type="tertiary"
            width={windowWidth}
            height={windowHeight}
            autoPlay
            loop={false}
          />
        </View>
      )}
      <View style={isMobile ? {} : IS_MOBILE_UP_BENZIN_BREAKPOINT ? spacings.mb2Xl : spacings.mbXl}>
        <Step
          title="Signed"
          stepName="signed"
          activeStep={displayActiveStep}
          finalizedStatus={finalizedStatus}
          rows={stepRows}
          testID="signed-step"
        />
        {shouldShowTxnProgress(finalizedStatus) && (
          <Step
            title={isFinalized ? 'Transaction details' : 'Your transaction is in progress'}
            stepName="in-progress"
            activeStep={displayActiveStep}
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
        {shouldShowBalanceChanges && (
          <Step
            title="Balance changes"
            stepName="balance-changes"
            activeStep={displayActiveStep}
            finalizedStatus={finalizedStatus}
            testID="balance-changes-step"
          >
            <View style={flexbox.flex1}>
              {!hasBalanceChangesLoaded && (
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    spacings.phSm,
                    spacings.pvSm,
                    {
                      backgroundColor: theme.secondaryBackground,
                      borderWidth: 1,
                      borderColor: theme.secondaryBorder,
                      ...common.borderRadiusPrimary
                    }
                  ]}
                >
                  <Spinner style={{ width: 18, height: 18 }} />
                  <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
                    Loading balance changes
                  </Text>
                </View>
              )}
              {hasBalanceChangesLoaded && !!(assetsOut.length || assetsIn.length) && (
                <View
                  style={
                    shouldRenderBalanceChangesInColumns
                      ? [flexbox.directionRow, flexbox.flex1]
                      : undefined
                  }
                >
                  {!!assetsOut.length && (
                    <View
                      style={
                        shouldRenderBalanceChangesInColumns
                          ? [flexbox.flex1, spacings.mrTy]
                          : spacings.mbTy
                      }
                    >
                      {renderBalanceChangesCard('Asset out', assetsOut)}
                    </View>
                  )}
                  {!!assetsIn.length && (
                    <View style={flexbox.flex1}>
                      {renderBalanceChangesCard('Asset in', assetsIn)}
                    </View>
                  )}
                </View>
              )}
              {hasBalanceChangesLoaded && !assetsOut.length && !assetsIn.length && (
                <View
                  style={[
                    spacings.phSm,
                    spacings.pvSm,
                    {
                      backgroundColor: theme.secondaryBackground,
                      borderWidth: 1,
                      borderColor: theme.secondaryBorder,
                      ...common.borderRadiusPrimary
                    }
                  ]}
                >
                  <Text fontSize={14} appearance="secondaryText">
                    No balance changes detected
                  </Text>
                </View>
              )}
            </View>
          </Step>
        )}
        <Step
          // We want to show the user the positive outcome of the transaction while it is still in progress
          title={finalizedStatus && finalizedStatus.status ? finalizedStatus.status : 'Confirmed'}
          testID="finalized-rows"
          stepName="finalized"
          finalizedStatus={finalizedStatus}
          activeStep={displayActiveStep}
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
