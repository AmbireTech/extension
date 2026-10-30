import { DeviceModelId } from '@ledgerhq/device-management-kit'

import { AMBIRE_SIGNER_APDUS } from './artifacts'
import {
  getLoadScriptApiLevel,
  getOsMismatchMessage,
  OS_VERSION_BY_API_LEVEL,
  parseLedgerAppApdus
} from './ledgerAppLoader'

describe('Ambire Signer load scripts', () => {
  // Fails when the synced builds move to a new Ledger OS API level: add a row
  // to OS_VERSION_BY_API_LEVEL, or users on a mismatched firmware only get the
  // generic 0x511f error instead of being told who needs to update.
  it.each(Object.entries(AMBIRE_SIGNER_APDUS))(
    'maps the API level of the %s build to an OS version',
    (modelId, apduDump) => {
      const apiLevel = getLoadScriptApiLevel(parseLedgerAppApdus(apduDump!))

      expect(apiLevel).toBeDefined()
      expect(OS_VERSION_BY_API_LEVEL[apiLevel!]?.[modelId as DeviceModelId]).toBeDefined()
    }
  )
})

describe('getOsMismatchMessage', () => {
  // API level 27 is Stax OS 1.11
  it('tells the user Ambire has to update when the firmware is newer', () => {
    expect(getOsMismatchMessage(DeviceModelId.STAX, '1.12.0', 27)).toContain('newer')
    expect(getOsMismatchMessage(DeviceModelId.STAX, '2.0.0', 27)).toContain('newer')
  })
  it('tells the user to update the Ledger when the firmware is older', () => {
    expect(getOsMismatchMessage(DeviceModelId.STAX, '1.10.1', 27)).toContain('firmware update')
  })
  it('lets a matching firmware through, patch and suffix included', () => {
    expect(getOsMismatchMessage(DeviceModelId.STAX, '1.11.0', 27)).toBeNull()
    expect(getOsMismatchMessage(DeviceModelId.STAX, '1.11.1-rc2', 27)).toBeNull()
  })
  it('lets the install go ahead when it cannot tell', () => {
    expect(getOsMismatchMessage(DeviceModelId.STAX, 'garbage', 27)).toBeNull()
    expect(getOsMismatchMessage(DeviceModelId.STAX, '1.12.0', 9999)).toBeNull()
    expect(getOsMismatchMessage(DeviceModelId.STAX, '1.12.0', undefined)).toBeNull()
  })
})
