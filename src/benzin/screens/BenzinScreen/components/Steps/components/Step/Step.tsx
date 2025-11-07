import { LinearGradient } from 'expo-linear-gradient'
import React, { FC, useState } from 'react'
import { Pressable, TextStyle, View, ViewStyle } from 'react-native'

import { FinalizedStatusType } from '@benzin/screens/BenzinScreen/interfaces/steps'
import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import ConfirmedIcon from '@common/assets/svg/ConfirmedIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import RejectedIcon from '@common/assets/svg/RejectedIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import StatusExplanation from './StatusExplanation'
import StepRow from './StepRow'
import { StepRowProps as StepRowInterface } from './StepRow/StepRow'
import getStyles from './styles'

const STEPS = ['signed', 'in-progress', 'finalized'] as const

interface StepProps {
  title?: string
  rows?: StepRowInterface[]
  stepName: typeof STEPS[number]
  activeStep: typeof STEPS[number]
  finalizedStatus?: FinalizedStatusType
  style?: ViewStyle
  titleStyle?: TextStyle
  children?: React.ReactNode | React.ReactNode[]
  testID?: string
  collapsibleRows?: boolean
}

const Step: FC<StepProps> = ({
  title,
  rows,
  stepName,
  activeStep,
  finalizedStatus,
  style,
  titleStyle,
  children,
  testID,
  collapsibleRows = false
}) => {
  const { theme, styles } = useTheme(getStyles)

  const [showAllRows, setShowAllRows] = useState(false)

  // Steps have 3 stages:
  // 1. Initial (not yet started and not next step)
  // 2. Next (not yet started but next step)
  // 3. Completed (=< active step)
  const stepIndex = STEPS.indexOf(stepName)
  const activeStepIndex = STEPS.indexOf(activeStep)
  const isInitial = stepIndex > activeStepIndex
  const isNext = stepIndex === activeStepIndex + 1
  const isCompleted = stepIndex <= activeStepIndex

  // Whether the line gradient should have red in it.
  const isRedDisplayedInLineGradient =
    (finalizedStatus?.status === 'failed' && stepIndex === 1) ||
    finalizedStatus?.status === 'dropped' ||
    finalizedStatus?.status === 'rejected' ||
    finalizedStatus?.status === 'not-found'

  // True if the transaction has failed and we are on the last step, because only the last step shows the error message.
  const hasFailed =
    (finalizedStatus?.status === 'failed' ||
      finalizedStatus?.status === 'dropped' ||
      finalizedStatus?.status === 'rejected' ||
      finalizedStatus?.status === 'not-found') &&
    stepIndex === STEPS.length - 1

  const getTitleAppearance = () => {
    if (hasFailed) {
      return 'errorText'
    }

    if (isCompleted) {
      return 'successText'
    }

    return 'primaryText'
  }

  return (
    <View style={[styles.step, style]} testID={testID}>
      <View>
        {isCompleted && !hasFailed && (
          <ConfirmedIcon
            color={theme.successDecorative}
            checkColor={theme.primaryBackground}
            style={styles.icon}
            // If this is the final step, and it's completed successfully,
            // we set a testID to allow easy txn status verification in E2E tests.
            testID={stepName === 'finalized' ? 'txn-confirmed' : ''}
          />
        )}
        {(isNext || isInitial) && !hasFailed && (
          <View style={[styles.circle, isNext ? styles.nextCircle : {}]} />
        )}
        {hasFailed && (
          <RejectedIcon width={18} height={18} color={theme.errorDecorative} style={styles.icon} />
        )}
        {isCompleted && stepName !== 'finalized' && (
          <LinearGradient
            style={{
              width: 2,
              flex: 1
            }}
            colors={[
              theme.successDecorative as string,
              (isRedDisplayedInLineGradient
                ? theme.errorDecorative
                : theme.successDecorative) as string
            ]}
            locations={[0.5, 1]}
          />
        )}
        {!isCompleted && (
          <View
            style={{
              width: 2,
              flex: 1,
              borderLeftColor: theme.secondaryBorder,
              borderLeftWidth: 2,
              borderStyle: 'dotted'
            }}
          />
        )}
      </View>
      <View
        style={[
          spacings.plMd,
          flexbox.flex1,
          stepIndex !== STEPS.length - 1
            ? spacings[IS_MOBILE_UP_BENZIN_BREAKPOINT ? 'pb2Xl' : 'pbLg']
            : {}
        ]}
      >
        {!!title && (
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
            <Text
              testID="transaction-confirmed-text"
              appearance={getTitleAppearance()}
              fontSize={16}
              weight="medium"
              style={[styles.title, titleStyle]}
            >
              {title === 'fetching' ? 'Confirmed' : ''}
              {title === 'not-found' ? 'Not Found' : ''}
              {title !== 'fetching' && title !== 'not-found' ? title : ''}
            </Text>
            {collapsibleRows && (
              <Pressable onPress={() => setShowAllRows((prev) => !prev)}>
                {({ hovered }: any) => (
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <Text fontSize={14} color={theme.linkText}>
                      {showAllRows ? 'show less' : 'show more'}
                    </Text>

                    <View style={[styles.arrow, hovered && styles.arrowHovered]}>
                      {showAllRows ? <UpArrowIcon /> : <DownArrowIcon />}
                    </View>
                  </View>
                )}
              </Pressable>
            )}
            <StatusExplanation status={finalizedStatus?.status} stepName={stepName} />
          </View>
        )}
        {children}
        {rows &&
          rows
            .filter((row) => !(row.collapsedByDefault && !showAllRows))
            .map((row) => <StepRow {...row} key={row.label} />)}
      </View>
    </View>
  )
}

export default Step
