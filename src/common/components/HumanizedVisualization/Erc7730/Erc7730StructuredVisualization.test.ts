import type { HumanizerErc7730Visualization } from '@ambire-common/libs/humanizer/interfaces'
import {
  getAction,
  getAddressVisualization,
  getLabel,
  getText,
  getToken
} from '../../../../ambire-common/src/libs/humanizer/utils'

import {
  getErc7730DescriptionRows,
  getErc7730SummaryRows,
  shouldShowErc7730SummaryRowLabel
} from './helpers'

describe('getErc7730DescriptionRows', () => {
  test('shows hidden transfer rows for Morpho Bundler3 Multicall additional description', () => {
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

    const descriptionRows = getErc7730DescriptionRows(visualization)

    expect(
      descriptionRows.map((row) => row.value.find((value) => value.type === 'action')?.content)
    ).toEqual(['Transfer', 'Transfer'])
    expect(descriptionRows.map((row) => row.value.find((value) => value.type === 'token'))).toEqual(
      [
        expect.objectContaining({ address: baseUsdc, value: 2n }),
        expect.objectContaining({ address: baseCbBtc, value: 1n })
      ]
    )
  })

  test('keeps swap token rows in summary and extra rows in additional description', () => {
    const baseWeth = '0x4200000000000000000000000000000000000006'
    const baseCbBtc = '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf'
    const visualization: HumanizerErc7730Visualization = {
      type: 'erc7730',
      title: 'Fill order',
      rows: [
        {
          label: 'Amount to Send',
          value: [getToken(baseCbBtc, 3235n)]
        },
        {
          label: 'Minimum to Receive',
          value: [getToken(baseWeth, 1161246143601818n)]
        },
        {
          label: 'Additional action',
          value: [getText('Unwrap')]
        }
      ]
    }

    const summaryRows = getErc7730SummaryRows(visualization)
    const descriptionRows = getErc7730DescriptionRows(visualization)

    expect(summaryRows.map((row) => row.label)).toEqual(['Amount to Send', 'Minimum to Receive'])
    expect(descriptionRows.map((row) => row.label)).toEqual(['Additional action'])
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
