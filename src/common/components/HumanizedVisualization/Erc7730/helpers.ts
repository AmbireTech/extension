import type {
  HumanizerErc7730Visualization,
  HumanizerVisualization
} from '@ambire-common/libs/humanizer/interfaces'
import { zeroAddress } from 'viem'

type Erc7730Row = HumanizerErc7730Visualization['fields'][number]

// The plain-text form of the rendered intent (e.g. "Swap"), for label
// comparisons/heuristics/non-rich surfaces. The leading part is an `action` for
// the plain form and for any interpolated intent that starts with literal text,
// which covers the templates seen in practice - but a template that opens with a
// placeholder ("{amount} swapped for...") leads with a token/address part
// instead, and there is no text to read, so callers must handle `undefined`.
export const getErc7730IntentText = (item: HumanizerErc7730Visualization) => item.intent[0]?.content

/** Keeps ERC-7730 text compact in layouts shared by mobile and the side panel. */
export const MOBILE_ERC7730_TEXT_SIZE = 14

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

const isZeroAddressBeneficiaryRow = (row: Erc7730Row) =>
  labelIncludes(row.label, ['beneficiary']) &&
  row.value.some(
    (value) => value.type === 'address' && value.address?.toLowerCase() === zeroAddress
  )

// Every field, regardless of what's already shown inline in the intent - for
// heuristics (spender/recipient detection, swap pairing, layout complexity,
// nested-call structure) that need full context.
export const getVisibleErc7730Rows = (item: HumanizerErc7730Visualization) =>
  item.fields.filter((row) => !isZeroAddressBeneficiaryRow(row))

// The rows to actually render below the intent: `fields` minus whatever the
// intent already shows inline (`excludedFieldPaths`).
export const getVisibleErc7730RowsExcludingIntentFields = (item: HumanizerErc7730Visualization) => {
  const excludedPaths = new Set(item.excludedFieldPaths)
  return getVisibleErc7730Rows(item).filter((row) => !excludedPaths.has(row.path ?? ''))
}

export const hasTokenValue = (row: Erc7730Row) => row.value.some((value) => value.type === 'token')

export const hasErc7730NativeValueRow = (item: HumanizerErc7730Visualization) =>
  getVisibleErc7730Rows(item).some(
    (row) =>
      row.label.trim().toLowerCase() === 'send' &&
      row.value.some(
        (value) =>
          value.type === 'token' && value.address.toLowerCase() === zeroAddress && value.value > 0n
      )
  )

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

export const isNestedErc7730Value = (
  value: HumanizerVisualization
): value is HumanizerVisualization & HumanizerErc7730Visualization => value.type === 'erc7730'

export const isNestedErc7730Row = (row: Erc7730Row) =>
  row.value.length > 0 && row.value.every(isNestedErc7730Value)

export const getDetailedRows = (item: HumanizerErc7730Visualization) => getVisibleErc7730Rows(item)

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
  getVisibleErc7730Rows(item).find((row) => isSpenderRow(row))

export const shouldShowErc7730SpenderRowInSummary = (item: HumanizerErc7730Visualization) =>
  !isSwapLikeTitle(getErc7730IntentText(item))

const getErc7730SwapSummaryRows = (item: HumanizerErc7730Visualization) => {
  const tokenRows = getVisibleErc7730Rows(item).filter((row) => hasTokenValue(row))
  if (tokenRows.length < 2) return null

  const outgoingRow = tokenRows.find((row) => isOutgoingTokenRow(row))
  const incomingRow = tokenRows.find((row) => isIncomingTokenRow(row))
  const hasDirectionalPair = !!outgoingRow && !!incomingRow && outgoingRow !== incomingRow

  if (!hasDirectionalPair && !isSwapLikeTitle(getErc7730IntentText(item))) return null

  if (hasDirectionalPair) return [outgoingRow, incomingRow]

  return tokenRows.slice(0, 2)
}

export const getErc7730SummaryRows = (item: HumanizerErc7730Visualization) => {
  const swapRows = getErc7730SwapSummaryRows(item)
  if (swapRows) return swapRows

  const visibleRows = getVisibleErc7730Rows(item)
  const amountRow = visibleRows.find((row) => hasTokenValue(row))
  if (amountRow) return [amountRow]

  return visibleRows.filter((row) => !isSpenderRow(row) && !isExpirationRow(row)).slice(0, 2)
}

export const shouldShowErc7730SummaryRowLabel = (
  item: HumanizerErc7730Visualization,
  row: Erc7730Row
) => {
  const rowLabel = row.label.trim()
  if (!rowLabel) return false

  return rowLabel !== getErc7730IntentText(item)?.trim()
}

export const shouldUseErc7730DetailedLayout = (item: HumanizerErc7730Visualization) => {
  if (labelIncludes(getErc7730IntentText(item) || '', ['multicall', 'batch', 'bundle'])) return true
  if (getVisibleErc7730Rows(item).some(isNestedErc7730Row)) return true

  const summaryRows = getErc7730SummaryRows(item)
  if (summaryRows.some(hasTokenValue)) return false

  const complexActionRows = summaryRows.filter(isComplexActionRow)

  return summaryRows.length > 1 && complexActionRows.length > 1
}
