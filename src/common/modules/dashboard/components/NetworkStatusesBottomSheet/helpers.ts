import { ThemeProps } from '@common/styles/themeConfig'

import { TIME_TAKEN_CATEGORIES } from './const'

type RequestType = 'discovery' | 'priceUpdate' | 'oracleCall'

const getCellStyle = (timeInMs: number, requestType: RequestType, theme: ThemeProps) => {
  if (!timeInMs) {
    return {
      backgroundColor: 'transparent',
      color: theme.secondaryText
    }
  }

  if (timeInMs <= TIME_TAKEN_CATEGORIES.fast[requestType]) {
    return {
      backgroundColor: theme.successBackground,
      color: theme.successText
    }
  }

  if (timeInMs >= TIME_TAKEN_CATEGORIES.slow[requestType]) {
    return {
      backgroundColor: theme.errorBackground,
      color: theme.errorText
    }
  }

  return {
    backgroundColor: theme.warningBackground,
    color: theme.warningText
  }
}

const getTimeAgo = (date: Date) => {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 5) return 'Just now'

  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)

  return `${minutes} minutes ago`
}

const formatResultTime = (timeInMs: number) => {
  if (!timeInMs) return 'Skipped'

  return `${timeInMs}ms`
}

/** Formats a duration as `840ms`, `12.4s` or `3m 05s`. */
const formatSyncDuration = (timeInMs: number) => {
  if (timeInMs < 1000) return `${timeInMs}ms`
  if (timeInMs < 60_000) return `${(timeInMs / 1000).toFixed(1)}s`

  const totalSeconds = Math.round(timeInMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

export { getCellStyle, getTimeAgo, formatResultTime, formatSyncDuration }
