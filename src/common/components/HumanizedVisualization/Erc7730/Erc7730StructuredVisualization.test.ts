import type { HumanizerErc7730Visualization } from '@ambire-common/libs/humanizer/interfaces'
import { zeroAddress } from 'viem'
import {
  getAction,
  getAddressVisualization,
  getLabel,
  getText,
  getToken
} from '../../../../ambire-common/src/libs/humanizer/utils'

import {
  getDetailedRows,
  getErc7730TitlePartsForRendering,
  getVisibleErc7730Rows,
  getVisibleErc7730RowsExcludingTitleParts,
  hasErc7730NativeValueRow,
  shouldUseErc7730DetailedLayout,
  shouldShowErc7730SummaryRowLabel
} from './helpers'

describe('getErc7730TitlePartsForRendering', () => {
  test('preserves intended spaces around rich values without spacing punctuation', () => {
    const firstToken = getToken('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 300000n)
    const secondToken = getToken('0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', 1n)
    const recipient = getAddressVisualization('0xd8293ad21678c6f09da139b4b62d38e514a03b78')

    const renderableParts = getErc7730TitlePartsForRendering([
      getAction('Swap '),
      firstToken,
      getText(' for at least '),
      secondToken,
      getText(' to '),
      recipient,
      getText('.')
    ])

    expect(
      renderableParts.map(({ part, shouldSpaceBefore }) => ({
        content: 'content' in part ? part.content : part.type,
        shouldSpaceBefore
      }))
    ).toEqual([
      { content: 'Swap', shouldSpaceBefore: false },
      { content: 'token', shouldSpaceBefore: true },
      { content: 'for at least', shouldSpaceBefore: true },
      { content: 'token', shouldSpaceBefore: true },
      { content: 'to', shouldSpaceBefore: true },
      { content: 'address', shouldSpaceBefore: true },
      { content: '.', shouldSpaceBefore: false }
    ])
  })
})

describe('getDetailedRows', () => {
  test('shows all Morpho Bundler3 Multicall actions in execution order', () => {
    const baseUsdc = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
    const baseCbBtc = '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf'
    const owner = '0xd8293ad21678c6f09da139b4b62d38e514a03b78'
    const visualization: HumanizerErc7730Visualization = {
      type: 'erc7730',
      title: 'Bundler3 Multicall',
      rows: [
        {
          label: 'Action',
          value: [
            getAction('Transfer'),
            getToken(baseUsdc, 2n),
            getLabel('To'),
            getAddressVisualization(owner)
          ]
        },
        {
          label: 'Action',
          value: [getAction('Supply'), getToken(baseCbBtc, 3200n)]
        },
        {
          label: 'Action',
          value: [getAction('Borrow'), getToken(baseUsdc, 100000n)]
        },
        {
          label: 'Action',
          value: [
            getAction('Transfer'),
            getToken(baseCbBtc, 1n),
            getLabel('To'),
            getAddressVisualization(owner)
          ]
        }
      ]
    }

    const detailedRows = getDetailedRows(visualization)

    expect(
      detailedRows.map((row) => row.value.find((value) => value.type === 'action')?.content)
    ).toEqual(['Transfer', 'Supply', 'Borrow', 'Transfer'])
    expect(shouldUseErc7730DetailedLayout(visualization)).toBe(true)
  })

  test('keeps a simple token action in the compact summary layout', () => {
    const visualization: HumanizerErc7730Visualization = {
      type: 'erc7730',
      title: 'Send',
      rows: [
        {
          label: 'Amount',
          value: [getToken('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 300000n)]
        }
      ]
    }

    expect(shouldUseErc7730DetailedLayout(visualization)).toBe(false)
  })
})

describe('getVisibleErc7730Rows', () => {
  test('hides zero-address beneficiary rows', () => {
    const visualization: HumanizerErc7730Visualization = {
      type: 'erc7730',
      title: 'Swap',
      rows: [
        {
          label: 'Amount to Send',
          value: [getToken('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', 300000n)]
        },
        {
          label: 'Beneficiary',
          value: [getAddressVisualization(zeroAddress)]
        }
      ]
    }

    expect(getVisibleErc7730Rows(visualization).map((row) => row.label)).toEqual(['Amount to Send'])
  })

  test('keeps nonzero beneficiary rows', () => {
    const beneficiary = '0xd8293ad21678c6f09da139b4b62d38e514a03b78'
    const visualization: HumanizerErc7730Visualization = {
      type: 'erc7730',
      title: 'Swap',
      rows: [
        {
          label: 'Beneficiary',
          value: [getAddressVisualization(beneficiary)]
        }
      ]
    }

    expect(getVisibleErc7730Rows(visualization).map((row) => row.label)).toEqual(['Beneficiary'])
  })
})

describe('getVisibleErc7730RowsExcludingTitleParts', () => {
  test('returns no rows when every row value is already shown in the interpolated intent', () => {
    const token = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'
    const recipient = '0xd8293ad21678c6f09da139b4b62d38e514a03b78'
    const amount = getToken(token, 300000n)
    const recipientAddress = getAddressVisualization(recipient)
    const visualization: HumanizerErc7730Visualization = {
      type: 'erc7730',
      title: 'Send',
      titleParts: [getAction('Send'), amount, getLabel('to'), recipientAddress],
      rows: [
        { label: 'Amount', value: [amount] },
        { label: 'Recipient', value: [recipientAddress] }
      ]
    }

    expect(getVisibleErc7730RowsExcludingTitleParts(visualization)).toEqual([])
  })
})

describe('shouldShowErc7730SummaryRowLabel', () => {
  test('hides a summary row label when it matches the title', () => {
    const safe = '0x714fd3db837e72bd49b8eda02b8f4d53dfdde5ce'
    const visualization: HumanizerErc7730Visualization = {
      type: 'erc7730',
      title: 'Reject currently queued transaction',
      rows: [
        {
          label: 'Reject currently queued transaction',
          value: [getAddressVisualization(safe)]
        },
        {
          label: 'Gas token',
          value: [getAddressVisualization(safe)]
        }
      ]
    }

    expect(shouldShowErc7730SummaryRowLabel(visualization, visualization.rows[0]!)).toBe(false)
    expect(shouldShowErc7730SummaryRowLabel(visualization, visualization.rows[1]!)).toBe(true)
  })
})

describe('hasErc7730NativeValueRow', () => {
  const getApprovalVisualization = (nativeValue: bigint): HumanizerErc7730Visualization => ({
    type: 'erc7730',
    title: 'Approve',
    rows: [
      {
        label: 'Amount',
        value: [getToken('0xdac17f958d2ee523a2206206994597c13d831ec7', 1n)]
      },
      {
        label: 'Send',
        value: [getToken(zeroAddress, nativeValue)]
      }
    ]
  })

  test('detects a nonzero native Send row', () => {
    expect(hasErc7730NativeValueRow(getApprovalVisualization(1n))).toBe(true)
  })

  test('ignores a zero-value native Send row', () => {
    expect(hasErc7730NativeValueRow(getApprovalVisualization(0n))).toBe(false)
  })
})
