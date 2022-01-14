import { getAddress, hexDataLength } from 'ethers/lib/utils'

import i18n from '@config/localization/localization'
import { isEmail } from '@modules/common/services/validate'

const NUMBER_STRING_REGEX = /^([0-9]+\.?[0-9]*)$/
const HEX_DATA_LENGTH = 32
const TIME_LOCK_NUMBER_LENGTH = 6
const MAX_FILE_SIZE = 3072
const NEEDED_KEYS = ['salt', 'identityFactoryAddr', 'baseIdentityAddr', 'bytecode', 'signer']

const validateImportedAccountProps = (acc) => {
  if (!(acc && validateAccountProps(acc))) {
    return {
      success: false,
      message: i18n.t('The imported file does not contain needed account data.')
    }
  }

  if (!(acc.id && isValidAddress(acc.id))) {
    return {
      success: false,
      message: i18n.t('Failed to import JSON file: invalid id')
    }
  }

  if (!(acc.email && isEmail(acc.email))) {
    return {
      success: false,
      message: i18n.t('Failed to import JSON file: invalid email')
    }
  }

  if (!(acc.signer && isValidAddress(acc.signer.address || acc.signer.quickAccManager))) {
    return {
      success: false,
      message: i18n.t('JSON file: invalid signer address')
    }
  }

  if (acc.signer.quickAccManager) {
    if (!(acc.signer.timelock && isValidTimeLock(acc.signer.timelock))) {
      return {
        success: false,
        message: i18n.t('Failed to import JSON file: invalid signer timelock')
      }
    }

    if (!(acc.signer.one && isValidAddress(acc.signer.one))) {
      return {
        success: false,
        message: i18n.t('Failed to import JSON file: invalid signer one')
      }
    }

    if (!(acc.signer.two && isValidAddress(acc.signer.two))) {
      return {
        success: false,
        message: i18n.t('Failed to import JSON file: invalid signer two')
      }
    }
  }

  if (!(acc.salt && isValidSalt(acc.salt))) {
    return { success: false, message: i18n.t('JSON file: invalid salt') }
  }

  if (!(acc.identityFactoryAddr && isValidAddress(acc.identityFactoryAddr))) {
    return {
      success: false,
      message: i18n.t('JSON file: invalid identity Factory Address')
    }
  }

  if (!(acc.baseIdentityAddr && isValidAddress(acc.baseIdentityAddr))) {
    return {
      success: false,
      message: i18n.t('JSON file: invalid base Identity Address')
    }
  }

  return { success: true }
}

const isValidAddress = (addr) => {
  try {
    return getAddress(addr) === addr
  } catch (e) {
    return false
  }
}

const isValidTimeLock = (timelock) => {
  return (
    NUMBER_STRING_REGEX.test(timelock) && timelock.toString().length === TIME_LOCK_NUMBER_LENGTH
  )
}
const isValidSalt = (salt) => hexDataLength(salt) === HEX_DATA_LENGTH
const validateAccountProps = (acc) => NEEDED_KEYS.every((key) => Object.keys(acc).includes(key))
const fileSizeValidator = (file) => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'file-size-too-large',
      message: i18n.t('The file size is larger than {{maxSize}} KB.', {
        maxSize: (MAX_FILE_SIZE / 1024).toFixed(2)
      })
    }
  }

  return null
}

export { validateImportedAccountProps, fileSizeValidator }
