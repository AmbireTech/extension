import React, { FC, memo, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import {
  HumanizerErc7730Visualization,
  HumanizerVisualization
} from '@ambire-common/libs/humanizer/interfaces'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import ChainVisualization from '@common/components/HumanizedVisualization/ChainVisualization'
import EditApproval from '@common/components/HumanizedVisualization/EditApproval'
import {
  Erc7730Row,
  Erc7730StructuredVisualizationProps
} from '@common/components/HumanizedVisualization/Erc7730/interfaces'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

const labelIncludes = (label: string, needles: string[]) => {
  const normalizedLabel = label.trim().toLowerCase()

  return needles.some((needle) => normalizedLabel.includes(needle))
}

const isSpenderRow = (row: Erc7730Row) => {
  const label = row.label.trim().toLowerCase()

  return (
    ['spender', 'recipient', 'receiver', 'operator'].some((needle) => label.includes(needle)) ||
    label === 'to'
  )
}

const isExpirationRow = (row: Erc7730Row) =>
  labelIncludes(row.label, ['expires', 'expiration', 'deadline', 'valid', 'until'])

const hasTokenValue = (row: Erc7730Row) => row.value.some((value) => value.type === 'token')

const isOutgoingTokenRow = (row: Erc7730Row) =>
  labelIncludes(row.label, ['send', 'spend', 'pay', 'sell', 'input', 'amount in', 'amount to send'])

const isIncomingTokenRow = (row: Erc7730Row) =>
  labelIncludes(row.label, [
    'receive',
    'get',
    'buy',
    'output',
    'amount out',
    'minimum to receive',
    'receive minimum'
  ])

const isSwapLikeTitle = (title?: string) =>
  labelIncludes(title || '', ['swap', 'exchange', 'trade', 'bridge'])

const isComplexActionRow = (row: Erc7730Row) =>
  labelIncludes(row.label, ['action', 'call', 'operation', 'method'])

const isActionValue = (value: HumanizerVisualization) => value.type === 'action' && !!value.content

const getActionContent = (row: Erc7730Row) => row.value.find(isActionValue)?.content

const isNestedErc7730Value = (
  value: HumanizerVisualization
): value is HumanizerVisualization & HumanizerErc7730Visualization => value.type === 'erc7730'

const isNestedErc7730Row = (row: Erc7730Row) =>
  row.value.length > 0 && row.value.every(isNestedErc7730Value)

export const getNestedErc7730Visualizations = (item: HumanizerErc7730Visualization) =>
  getDetailedRows(item).flatMap((row) =>
    isNestedErc7730Row(row) ? row.value.filter(isNestedErc7730Value) : []
  )

const isMorphoBundlerMulticall = (item: HumanizerErc7730Visualization) =>
  (item.title || '').trim().toLowerCase() === 'bundler3 multicall'

const isTransferActionRow = (row: Erc7730Row) =>
  getActionContent(row)?.trim().toLowerCase() === 'transfer'

const getDetailedRows = (item: HumanizerErc7730Visualization) => {
  if (!isMorphoBundlerMulticall(item)) return item.rows

  const nonTransferRows = item.rows.filter((row) => !isTransferActionRow(row))

  return nonTransferRows.length ? nonTransferRows : item.rows
}

const isToLabelValue = (value: HumanizerVisualization) =>
  value.type === 'label' && value.content?.trim().toLowerCase() === 'to'

const getDetailedActionParts = (row: Erc7730Row) => {
  const action = row.value.find(isActionValue)
  if (!action) return null

  const recipientLabelIndex = row.value.findIndex(
    (value, valueIndex, values) =>
      isToLabelValue(value) && values[valueIndex + 1]?.type === 'address'
  )
  const recipientValues =
    recipientLabelIndex >= 0 ? row.value.slice(recipientLabelIndex, recipientLabelIndex + 2) : []
  const rightValues = row.value.filter(
    (value, valueIndex) =>
      value.id !== action.id &&
      valueIndex !== recipientLabelIndex &&
      valueIndex !== recipientLabelIndex + 1
  )

  return {
    action,
    recipientValues,
    rightValues
  }
}

const getDetailedValueLines = (row: Erc7730Row) =>
  row.value.reduce<HumanizerVisualization[][]>(
    (lines, value, valueIndex, values) => {
      const lastLine = lines[lines.length - 1]
      if (!lastLine) return [[value]]

      const shouldStartRecipientLine =
        isToLabelValue(value) && values[valueIndex + 1]?.type === 'address' && lastLine.length > 0

      if (shouldStartRecipientLine) {
        lines.push([value])
        return lines
      }

      lastLine.push(value)
      return lines
    },
    [[]]
  )

const getErc7730SpenderRow = (item: HumanizerErc7730Visualization) =>
  item.rows.find((row) => isSpenderRow(row))

const shouldShowErc7730SpenderRowInSummary = (item: HumanizerErc7730Visualization) =>
  !isSwapLikeTitle(item.title)

const getErc7730SwapSummaryRows = (item: HumanizerErc7730Visualization) => {
  const tokenRows = item.rows.filter((row) => hasTokenValue(row))
  if (tokenRows.length < 2) return null

  const outgoingRow = tokenRows.find((row) => isOutgoingTokenRow(row))
  const incomingRow = tokenRows.find((row) => isIncomingTokenRow(row))
  const hasDirectionalPair = !!outgoingRow && !!incomingRow && outgoingRow !== incomingRow

  if (!hasDirectionalPair && !isSwapLikeTitle(item.title)) return null

  if (hasDirectionalPair) return [outgoingRow, incomingRow]

  return tokenRows.slice(0, 2)
}

const getErc7730SummaryRows = (item: HumanizerErc7730Visualization) => {
  const swapRows = getErc7730SwapSummaryRows(item)
  if (swapRows) return swapRows

  const amountRow = item.rows.find((row) => hasTokenValue(row))
  if (amountRow) return [amountRow]

  return item.rows.filter((row) => !isSpenderRow(row) && !isExpirationRow(row)).slice(0, 2)
}

export const getErc7730DescriptionRows = (item: HumanizerErc7730Visualization) => {
  const visibleSummaryRows = [
    shouldShowErc7730SpenderRowInSummary(item) ? getErc7730SpenderRow(item) : undefined,
    ...getErc7730SummaryRows(item)
  ].filter((row): row is Erc7730Row => !!row)

  return item.rows.filter((row) => !visibleSummaryRows.includes(row))
}

export const shouldUseErc7730DetailedLayout = (item: HumanizerErc7730Visualization) => {
  if (labelIncludes(item.title || '', ['multicall', 'batch', 'bundle'])) return true
  if (item.rows.some(isNestedErc7730Row)) return true

  const summaryRows = getErc7730SummaryRows(item)
  if (summaryRows.some(hasTokenValue)) return false

  const complexActionRows = summaryRows.filter(isComplexActionRow)

  return summaryRows.length > 1 && complexActionRows.length > 1
}

const Erc7730StructuredVisualization: FC<Erc7730StructuredVisualizationProps> = ({
  item,
  chainId,
  sizeMultiplierSize,
  textSize,
  mode = 'summary',
  editApprovalCallInfo,
  hasRightArrow = false,
  hideNestedRows = false
}) => {
  const { theme } = useTheme()
  const detailedRows = useMemo(
    () => getDetailedRows(item).filter((row) => !hideNestedRows || !isNestedErc7730Row(row)),
    [hideNestedRows, item]
  )

  const renderValue = useCallback(
    (valueItem: HumanizerVisualization, overrideTextSize = textSize): React.ReactNode => {
      if (!valueItem || ('isHidden' in valueItem && valueItem.isHidden)) return null

      if (valueItem.type === 'token') {
        const tokenChainId = valueItem.chainId || chainId

        if (mode === 'summary') {
          return (
            <View
              key={valueItem.id}
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifyEnd,
                {
                  minWidth: 0,
                  maxWidth: '100%'
                }
              ]}
            >
              <TokenOrNft
                sizeMultiplierSize={sizeMultiplierSize}
                value={valueItem.value}
                address={valueItem.address}
                textSize={overrideTextSize}
                chainId={tokenChainId}
                tokenMarginRight={0}
                tokenIconContainerSize={20}
              />
              {editApprovalCallInfo && (
                <EditApproval
                  editCall={editApprovalCallInfo.setter}
                  token={editApprovalCallInfo.token}
                  value={editApprovalCallInfo.amount}
                  id={editApprovalCallInfo.callId}
                  style={[spacings.mlTy, spacings.mr0]}
                />
              )}
            </View>
          )
        }

        return (
          <View
            key={valueItem.id}
            style={[
              flexbox.alignEnd,
              {
                minWidth: 0,
                maxWidth: '100%'
              }
            ]}
          >
            <View
              style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, flexbox.wrap]}
            >
              <TokenOrNft
                sizeMultiplierSize={sizeMultiplierSize}
                value={valueItem.value}
                address={valueItem.address}
                textSize={overrideTextSize}
                chainId={tokenChainId}
                tokenMarginRight={0}
                tokenIconContainerSize={20}
              />
              {editApprovalCallInfo && (
                <EditApproval
                  editCall={editApprovalCallInfo.setter}
                  token={editApprovalCallInfo.token}
                  value={editApprovalCallInfo.amount}
                  id={editApprovalCallInfo.callId}
                  style={[spacings.mlTy, spacings.mr0]}
                />
              )}
            </View>
          </View>
        )
      }

      if (valueItem.type === 'address' && valueItem.address) {
        return (
          <HumanizerAddress
            key={valueItem.id}
            address={valueItem.address}
            chainId={valueItem.chainId || chainId}
            fontSize={overrideTextSize}
            actionsMode="inline"
            hideLogo
          />
        )
      }

      if (valueItem.type === 'chain' && valueItem.chainId) {
        return <ChainVisualization chainId={valueItem.chainId} key={valueItem.id} marginRight={0} />
      }

      if (valueItem.type === 'erc7730') {
        return (
          <Erc7730StructuredVisualization
            key={valueItem.id}
            item={valueItem}
            chainId={chainId}
            sizeMultiplierSize={sizeMultiplierSize}
            textSize={overrideTextSize}
            mode="description"
          />
        )
      }

      if (valueItem.content) {
        return (
          <Text
            key={valueItem.id}
            fontSize={overrideTextSize}
            weight={valueItem.isBold || valueItem.type === 'action' ? 'semiBold' : 'medium'}
            color={
              valueItem.warning
                ? theme.warningText
                : valueItem.type === 'label'
                  ? theme.secondaryText
                  : valueItem.type === 'action'
                    ? theme.secondaryAccent400
                    : theme.primaryText
            }
            style={[{ textAlign: 'right', flexShrink: 1 }, valueItem.mlMi && spacings.mlMi]}
          >
            {valueItem.content}
          </Text>
        )
      }

      return null
    },
    [chainId, editApprovalCallInfo, mode, sizeMultiplierSize, textSize, theme]
  )

  const renderDetailedValueLine = useCallback(
    (values: HumanizerVisualization[], alignment: 'start' | 'end' = 'end') => (
      <View
        key={values.map((value) => value.id).join('-')}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          alignment === 'start' ? flexbox.justifyStart : flexbox.justifyEnd,
          flexbox.wrap,
          {
            minWidth: 0,
            maxWidth: '100%'
          }
        ]}
      >
        {values.map((value) => {
          const renderedValue = renderValue(value)
          if (!renderedValue) return null

          const isLastElement = value.id === values[values.length - 1]?.id

          return (
            <View key={value.id} style={!isLastElement && spacings.mrTy}>
              {renderedValue}
            </View>
          )
        })}
      </View>
    ),
    [renderValue]
  )

  if (mode === 'summary') {
    const summaryRows = getErc7730SummaryRows(item)
    const shouldStackSummaryRows = summaryRows.length > 1 && summaryRows.every(hasTokenValue)
    const spenderRow = shouldShowErc7730SpenderRowInSummary(item)
      ? getErc7730SpenderRow(item)
      : undefined
    const subtitleTextSize = Math.max(textSize - 3, 11)

    return (
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          {
            width: '100%',
            minWidth: 0,
            alignItems: 'center'
          }
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            {
              minWidth: 0,
              flex: 1,
              flexShrink: 1,
              marginRight: SPACING_SM
            }
          ]}
        >
          {!!item.dapp?.icon && (
            <ManifestImage
              uri={item.dapp.icon}
              containerStyle={{ marginRight: SPACING_TY }}
              size={24 * sizeMultiplierSize}
              skeletonAppearance="secondaryBackground"
              imageStyle={{ borderRadius: 12 * sizeMultiplierSize, backgroundColor: 'transparent' }}
            />
          )}
          <View
            style={[
              {
                minWidth: 0,
                flexShrink: 1
              }
            ]}
          >
            {!!item.title && (
              <Text
                fontSize={textSize + 2}
                weight="semiBold"
                color={theme.secondaryAccent400}
                numberOfLines={1}
                style={spacings.mrSm}
              >
                {item.title}
              </Text>
            )}
            {spenderRow && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  {
                    maxWidth: '100%',
                    minWidth: 0,
                    flexShrink: 1
                  }
                ]}
              >
                <Text
                  fontSize={subtitleTextSize}
                  weight="semiBold"
                  appearance="secondaryText"
                  numberOfLines={1}
                  style={spacings.mrTy}
                >
                  {spenderRow.label}
                </Text>
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    {
                      minWidth: 0,
                      flexShrink: 1
                    }
                  ]}
                >
                  {spenderRow.value.map((value) => renderValue(value, subtitleTextSize))}
                </View>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            shouldStackSummaryRows ? flexbox.alignEnd : flexbox.directionRow,
            !shouldStackSummaryRows && flexbox.alignCenter,
            flexbox.justifyEnd,
            {
              minWidth: 0,
              flexShrink: 0,
              ...(shouldStackSummaryRows ? { flexDirection: 'column' } : {})
            }
          ]}
        >
          {summaryRows.map((row, index) => (
            <View
              key={`${item.id}-summary-${row.label}-${row.value
                .map((value) => value.id)
                .join('-')}`}
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifyEnd,
                shouldStackSummaryRows && index > 0 && spacings.mtMi,
                !shouldStackSummaryRows && index > 0 && spacings.mlSm,
                {
                  minWidth: 0,
                  maxWidth: shouldStackSummaryRows ? 520 : index === 0 ? 360 : 260
                }
              ]}
            >
              {(!hasTokenValue(row) || shouldStackSummaryRows) && (
                <Text
                  fontSize={Math.max(textSize - 4, 10)}
                  weight="semiBold"
                  appearance="secondaryText"
                  numberOfLines={1}
                  style={[
                    spacings.mrTy,
                    shouldStackSummaryRows && {
                      flexShrink: 1,
                      maxWidth: 180
                    }
                  ]}
                >
                  {row.label}
                </Text>
              )}
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyEnd,
                  {
                    minWidth: 0,
                    maxWidth: '100%'
                  }
                ]}
              >
                {row.value.map((value) => renderValue(value))}
              </View>
            </View>
          ))}
        </View>
        {hasRightArrow && (
          <View style={{ marginLeft: SPACING_SM }}>
            <RightArrowIcon color={theme.secondaryText} width={8} height={14} />
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={{ width: '100%' }}>
      {detailedRows.map((row) => {
        const actionParts = getDetailedActionParts(row)
        const rowKey = `${item.id}-${row.label}-${row.value.map((value) => value.id).join('-')}`

        if (isNestedErc7730Row(row)) {
          const nestedVisualizations = row.value.filter(isNestedErc7730Value)

          return (
            <View key={rowKey} style={{ width: '100%', paddingVertical: SPACING_TY }}>
              {!!row.label.trim() && (
                <Text
                  fontSize={textSize}
                  weight="semiBold"
                  appearance="secondaryText"
                  style={spacings.mbTy}
                >
                  {row.label}
                </Text>
              )}
              <View style={{ width: '100%' }}>
                {nestedVisualizations.map((nestedVisualization, nestedIndex) => (
                  <View
                    key={nestedVisualization.id}
                    style={[
                      flexbox.directionRow,
                      flexbox.alignCenter,
                      nestedIndex > 0 && {
                        marginTop: SPACING_TY,
                        paddingTop: SPACING_TY
                      }
                    ]}
                  >
                    <Erc7730StructuredVisualization
                      item={nestedVisualization}
                      chainId={chainId}
                      sizeMultiplierSize={sizeMultiplierSize}
                      textSize={textSize}
                      mode="summary"
                    />
                  </View>
                ))}
              </View>
            </View>
          )
        }

        if (actionParts) {
          return (
            <View
              key={rowKey}
              style={[
                flexbox.directionRow,
                flexbox.justifySpaceBetween,
                flexbox.alignStart,
                {
                  width: '100%',
                  paddingVertical: SPACING_TY,
                  flexWrap: 'wrap'
                }
              ]}
            >
              <View style={{ flex: 1, minWidth: 160, marginRight: SPACING_SM }}>
                <Text
                  fontSize={textSize}
                  weight="semiBold"
                  color={theme.secondaryAccent400}
                  style={{ flexShrink: 1 }}
                >
                  {actionParts.action.content}
                </Text>
                {!!actionParts.recipientValues.length && (
                  <View style={spacings.mtMi}>
                    {renderDetailedValueLine(actionParts.recipientValues, 'start')}
                  </View>
                )}
              </View>
              <View
                style={[
                  flexbox.justifyEnd,
                  flexbox.alignEnd,
                  {
                    flex: 1.6,
                    minWidth: 160
                  }
                ]}
              >
                {getDetailedValueLines({ ...row, value: actionParts.rightValues }).map((line) =>
                  renderDetailedValueLine(line)
                )}
              </View>
            </View>
          )
        }

        return (
          <View
            key={rowKey}
            style={[
              flexbox.directionRow,
              flexbox.justifySpaceBetween,
              flexbox.alignStart,
              {
                width: '100%',
                paddingVertical: SPACING_TY,
                flexWrap: 'wrap'
              }
            ]}
          >
            <Text
              fontSize={textSize}
              weight="semiBold"
              appearance="secondaryText"
              style={{ flex: 1, minWidth: 120, marginRight: SPACING_SM }}
            >
              {row.label}
            </Text>
            <View
              style={[
                flexbox.justifyEnd,
                flexbox.alignEnd,
                {
                  flex: 1.6,
                  minWidth: 160
                }
              ]}
            >
              {getDetailedValueLines(row).map((line) => renderDetailedValueLine(line))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default memo(Erc7730StructuredVisualization)
