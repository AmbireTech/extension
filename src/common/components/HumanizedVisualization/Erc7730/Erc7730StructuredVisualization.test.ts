import type {
  HumanizerErc7730Row,
  HumanizerErc7730Visualization,
  HumanizerVisualization
} from '@ambire-common/libs/humanizer/interfaces'
import { zeroAddress } from 'viem'
import {
  getAction,
  getAddressVisualization,
  getErc7730RowLabel,
  getErc7730RowValues,
  getLabel,
  getToken
} from '../../../../ambire-common/src/libs/humanizer/utils'

import {
  getDetailedRows,
  getVisibleErc7730Rows,
  getVisibleErc7730RowsExcludingIntentFields,
  hasErc7730NativeValueRow,
  shouldUseErc7730DetailedLayout,
  shouldShowErc7730SummaryRowLabel
} from './helpers'

// `path` defaults to the label since these fixtures don't care about real ERC-7730 paths.
const row = (label: string, value: HumanizerVisualization, path = label): HumanizerErc7730Row => ({
  type: 'single-value',
  label,
  value,
  path
})

// An embedded call, kept as the flat run of parts a legacy humanizer module produced for it.
const callRow = (value: HumanizerVisualization[]): HumanizerErc7730Row => ({
  type: 'call',
  value
})

// Builds a fixture matching the current `HumanizerErc7730Visualization` shape. `intent` is the
// plain action (or pass `intentParts` to simulate an interpolated one); `fields` is every row.
const buildVisualization = (
  intent: string,
  fields: HumanizerErc7730Row[],
  {
    excludedFieldPaths = [],
    intentParts
  }: { excludedFieldPaths?: string[]; intentParts?: HumanizerVisualization[] } = {}
): HumanizerErc7730Visualization => ({
  type: 'erc7730',
  intent: intentParts ?? [getAction(intent)],
  excludedFieldPaths,
  fields
})

describe('getDetailedRows', () => {
  test('shows all Morpho Bundler3 Multicall actions in execution order', () => {
    const baseUsdc = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
    const baseCbBtc = '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf'
    const owner = '0xd8293ad21678c6f09da139b4b62d38e514a03b78'
    const visualization = buildVisualization('Bundler3 Multicall', [
      callRow([
        getAction('Transfer'),
        getToken(baseUsdc, 2n),
        getLabel('To'),
        getAddressVisualization(owner)
      ]),
      callRow([getAction('Supply'), getToken(baseCbBtc, 3200n)]),
      callRow([getAction('Borrow'), getToken(baseUsdc, 100000n)]),
      callRow([
        getAction('Transfer'),
        getToken(baseCbBtc, 1n),
        getLabel('To'),
        getAddressVisualization(owner)
      ])
    ])

    const detailedRows = getDetailedRows(visualization)

    expect(
      detailedRows.map(
        (r) => getErc7730RowValues(r).find((value) => value.type === 'action')?.content
      )
    ).toEqual(['Transfer', 'Supply', 'Borrow', 'Transfer'])
    expect(shouldUseErc7730DetailedLayout(visualization)).toBe(true)
  })

  test('keeps a simple token action in the compact summary layout', () => {
    const visualization = buildVisualization('Send', [
      row('Amount', getToken('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 300000n))
    ])

    expect(shouldUseErc7730DetailedLayout(visualization)).toBe(false)
  })
})

describe('getVisibleErc7730Rows', () => {
  test('hides zero-address beneficiary rows', () => {
    const visualization = buildVisualization('Swap', [
      row('Amount to Send', getToken('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 300000n)),
      row('Beneficiary', getAddressVisualization(zeroAddress))
    ])

    expect(getVisibleErc7730Rows(visualization).map(getErc7730RowLabel)).toEqual(['Amount to Send'])
  })

  test('keeps nonzero beneficiary rows', () => {
    const beneficiary = '0xd8293ad21678c6f09da139b4b62d38e514a03b78'
    const visualization = buildVisualization('Swap', [
      row('Beneficiary', getAddressVisualization(beneficiary))
    ])

    expect(getVisibleErc7730Rows(visualization).map(getErc7730RowLabel)).toEqual(['Beneficiary'])
  })
})

describe('getVisibleErc7730RowsExcludingIntentFields', () => {
  test('returns no rows when every field path is already shown in the interpolated intent', () => {
    const token = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
    const recipient = '0xd8293ad21678c6f09da139b4b62d38e514a03b78'
    const amount = getToken(token, 300000n)
    const recipientAddress = getAddressVisualization(recipient)
    // Simulates what `formatToVisualizations` produces once every field is consumed by the
    // interpolated intent: `fields` still holds everything, but both paths are excluded.
    const visualization = buildVisualization(
      'Send',
      [row('Amount', amount, 'amount'), row('Recipient', recipientAddress, 'recipient')],
      {
        excludedFieldPaths: ['amount', 'recipient'],
        intentParts: [getAction('Send'), amount, getLabel('to'), recipientAddress]
      }
    )

    expect(getVisibleErc7730RowsExcludingIntentFields(visualization)).toEqual([])
  })
})

describe('shouldShowErc7730SummaryRowLabel', () => {
  test('hides a summary row label when it matches the intent', () => {
    const safe = '0x714fd3db837e72bd49b8eda02b8f4d53dfdde5ce'
    const visualization = buildVisualization('Reject currently queued transaction', [
      row('Reject currently queued transaction', getAddressVisualization(safe)),
      row('Gas token', getAddressVisualization(safe))
    ])

    expect(shouldShowErc7730SummaryRowLabel(visualization, visualization.fields[0]!)).toBe(false)
    expect(shouldShowErc7730SummaryRowLabel(visualization, visualization.fields[1]!)).toBe(true)
  })
})

describe('hasErc7730NativeValueRow', () => {
  const getApprovalVisualization = (nativeValue: bigint): HumanizerErc7730Visualization =>
    buildVisualization('Approve', [
      row('Amount', getToken('0xdac17f958d2ee523a2206206994597c13d831ec7', 1n)),
      row('Send', getToken(zeroAddress, nativeValue))
    ])

  test('detects a nonzero native Send row', () => {
    expect(hasErc7730NativeValueRow(getApprovalVisualization(1n))).toBe(true)
  })

  test('ignores a zero-value native Send row', () => {
    expect(hasErc7730NativeValueRow(getApprovalVisualization(0n))).toBe(false)
  })
})
