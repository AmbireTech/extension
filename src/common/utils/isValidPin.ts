import { isString } from 'lodash'

import i18n from '@common/config/localization/localization'

export const PIN_LENGTH = 6

export const isValidPin = (value: string | true | object | null | undefined) => {
  const errorMessage = i18n.t(
    'PIN must be {{PIN_LENGTH}} digits in length and contain only numbers.',
    {
      PIN_LENGTH
    }
  ) as string

  if (!isString(value) || !value) return errorMessage

  const pinRegex = new RegExp(`^\\d{${PIN_LENGTH}}$`) // matches exactly PIN_LENGTH digits (0-9)

  return pinRegex.test(value) || errorMessage
}
