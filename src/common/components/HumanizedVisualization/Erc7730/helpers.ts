import type {
  HumanizerErc7730Visualization,
  HumanizerVisualization
} from '@ambire-common/libs/humanizer/interfaces'

type Erc7730Row = HumanizerErc7730Visualization['rows'][number]

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

export const hasTokenValue = (row: Erc7730Row) => row.value.some((value) => value.type === 'token')

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

export const isNestedErc7730Value = (
  value: HumanizerVisualization
): value is HumanizerVisualization & HumanizerErc7730Visualization => value.type === 'erc7730'

export const isNestedErc7730Row = (row: Erc7730Row) =>
  row.value.length > 0 && row.value.every(isNestedErc7730Value)

const isMorphoBundlerMulticall = (item: HumanizerErc7730Visualization) =>
  (item.title || '').trim().toLowerCase() === 'bundler3 multicall'

const isTransferActionRow = (row: Erc7730Row) =>
  getActionContent(row)?.trim().toLowerCase() === 'transfer'

export const getDetailedRows = (item: HumanizerErc7730Visualization) => {
  if (!isMorphoBundlerMulticall(item)) return item.rows

  const nonTransferRows = item.rows.filter((row) => !isTransferActionRow(row))

  return nonTransferRows.length ? nonTransferRows : item.rows
}

const isToLabelValue = (value: HumanizerVisualization) =>
  value.type === 'label' && value.content?.trim().toLowerCase() === 'to'

export const getDetailedActionParts = (row: Erc7730Row) => {
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

export const getDetailedValueLines = (row: Erc7730Row) =>
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

export const getErc7730SpenderRow = (item: HumanizerErc7730Visualization) =>
  item.rows.find((row) => isSpenderRow(row))

export const shouldShowErc7730SpenderRowInSummary = (item: HumanizerErc7730Visualization) =>
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

export const getErc7730SummaryRows = (item: HumanizerErc7730Visualization) => {
  const swapRows = getErc7730SwapSummaryRows(item)
  if (swapRows) return swapRows

  const amountRow = item.rows.find((row) => hasTokenValue(row))
  if (amountRow) return [amountRow]

  return item.rows.filter((row) => !isSpenderRow(row) && !isExpirationRow(row)).slice(0, 2)
}

export const shouldShowErc7730SummaryRowLabel = (
  item: HumanizerErc7730Visualization,
  row: Erc7730Row
) => {
  const rowLabel = row.label.trim()
  if (!rowLabel) return false

  return rowLabel !== item.title?.trim()
}

export const getErc7730DescriptionRows = (item: HumanizerErc7730Visualization) => {
  if (isMorphoBundlerMulticall(item)) {
    const transferRows = item.rows.filter(isTransferActionRow)

    if (transferRows.length) return transferRows
  }

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

export const getNestedErc7730Visualizations = (item: HumanizerErc7730Visualization) =>
  getDetailedRows(item).flatMap((row) =>
    isNestedErc7730Row(row) ? row.value.filter(isNestedErc7730Value) : []
  )
