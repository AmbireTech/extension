import {
  AUTO_LOCK_TIMES,
  getAutoLockLabel
} from '@web/extension-services/background/controllers/auto-lock'

export const AUTO_LOCK_OPTIONS = [
  {
    value: AUTO_LOCK_TIMES.never,
    label: getAutoLockLabel(AUTO_LOCK_TIMES.never)
  },
  {
    value: AUTO_LOCK_TIMES._7days,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._7days)
  },
  {
    value: AUTO_LOCK_TIMES._1day,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._1day)
  },
  {
    value: AUTO_LOCK_TIMES._8hours,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._8hours)
  },
  {
    value: AUTO_LOCK_TIMES._1hour,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._1hour)
  },
  {
    value: AUTO_LOCK_TIMES._10minutes,
    label: getAutoLockLabel(AUTO_LOCK_TIMES._10minutes)
  }
]
