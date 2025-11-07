import { Block } from 'ethers'

import { FeePaidWith } from '@benzin/screens/BenzinScreen/hooks/useSteps'
import { FinalizedStatusType } from '@benzin/screens/BenzinScreen/interfaces/steps'

const doNotShow = ['dropped', 'rejected', 'not-found']

const getDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h12'
  })
}

const shouldShowTxnProgress = (finalizedStatus: FinalizedStatusType) => {
  if (!finalizedStatus) return true

  return doNotShow.indexOf(finalizedStatus.status) === -1
}

const getTimestamp = (blockData: null | Block, finalizedStatus: FinalizedStatusType) => {
  if (blockData) {
    return getDate(blockData.timestamp)
  }

  return finalizedStatus && doNotShow.indexOf(finalizedStatus.status) !== -1 ? '-' : 'loading'
}

const getBlockNumber = (blockData: null | Block, finalizedStatus: FinalizedStatusType) => {
  if (blockData) {
    return blockData.number.toString()
  }

  return finalizedStatus && doNotShow.indexOf(finalizedStatus.status) !== -1 ? '-' : 'loading'
}

const getFinalizedRows = (blockData: null | Block, finalizedStatus: FinalizedStatusType) => {
  const rows: {
    label: string
    value: string
    error?: true
  }[] = [
    {
      label: 'Timestamp',
      value: getTimestamp(blockData, finalizedStatus)
    },
    {
      label: 'Block number',
      value: getBlockNumber(blockData, finalizedStatus)
    }
  ]

  if (finalizedStatus?.reason) {
    rows.unshift({
      label: 'Failed reason',
      value: finalizedStatus.reason,
      error: true
    })
  }

  return rows
}

const getFee = (cost: FeePaidWith | null, finalizedStatus: FinalizedStatusType) => {
  if (cost) {
    return `${cost.amount} ${cost.symbol} (${cost.usdValue})`
  }

  return finalizedStatus && doNotShow.indexOf(finalizedStatus.status) !== -1 ? '-' : 'loading'
}

export { getBlockNumber, getFee, getFinalizedRows, getTimestamp, shouldShowTxnProgress }
