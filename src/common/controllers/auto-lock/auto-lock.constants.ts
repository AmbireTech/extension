import i18n from 'i18next'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum AUTO_LOCK_TIMES {
  never = 0, // never
  _7days = 10080, // 7 days in minutes
  _1day = 1440, // 1 day in minutes
  _8hours = 480, // 8 hours in minutes
  _1hour = 60, // 1 hour in minutes
  _10minutes = 10 // 10 minutes
}

export const getAutoLockLabel = (time: AUTO_LOCK_TIMES) => {
  if (time === AUTO_LOCK_TIMES._7days) return i18n.t('7 days')
  if (time === AUTO_LOCK_TIMES._1day) return i18n.t('1 day')
  if (time === AUTO_LOCK_TIMES._8hours) return i18n.t('8 hours')
  if (time === AUTO_LOCK_TIMES._1hour) return i18n.t('1 hour')
  if (time === AUTO_LOCK_TIMES._10minutes) return i18n.t('10 minutes')

  return i18n.t('Never')
}

export const ALARMS_AUTO_LOCK = 'ALARMS_AUTO_LOCK'
