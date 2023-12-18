import HDKey from 'hdkey'

import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import LedgerEth from '@ledgerhq/hw-app-eth'
import Transport from '@ledgerhq/hw-transport'
import TransportWebHID from '@ledgerhq/hw-transport-webhid'

export const wait = (fn: () => void, ms = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      fn()
      resolve(true)
    }, ms)
  })
}

class LedgerController implements ExternalSignerController {
  hdk: any

  hdPathTemplate: HD_PATH_TEMPLATE_TYPE

  unlockedPath: string = ''

  unlockedPathKeyAddr: string = ''

  isWebHID: boolean

  transport: TransportWebHID | null

  app: null | LedgerEth

  type = 'ledger'

  deviceModel = 'unknown'

  deviceId = ''

  constructor() {
    this.hdk = new HDKey()
    // TODO: make it optional (by default should be false and set it to true only when there is ledger connected via usb)
    this.isWebHID = true
    this.transport = null
    this.app = null
    // TODO: Handle different derivation
    this.hdPathTemplate = BIP44_LEDGER_DERIVATION_TEMPLATE
  }

  isUnlocked(path?: string, expectedKeyOnThisPath?: string) {
    // If no path or expected key is provided, just check if there is any
    // unlocked path, that's a valid case when retrieving accounts for import.
    if (!path || !expectedKeyOnThisPath) {
      return !!(this.unlockedPath && this.unlockedPathKeyAddr)
    }

    // Make sure it's unlocked with the right path and with the right key,
    // otherwise - treat as not unlocked.
    return this.unlockedPathKeyAddr === expectedKeyOnThisPath && this.unlockedPath === path
  }

  async initAppIfNeeded() {
    if (this.app) return

    try {
      // @ts-ignore
      this.transport = await TransportWebHID.create()
      this.app = new LedgerEth(this.transport as Transport)

      if (this.transport?.deviceModel?.id) {
        this.deviceModel = this.transport.deviceModel.id
      }
      if (this.transport?.device?.productId) {
        this.deviceId = this.transport.device.productId.toString()
      }
    } catch (e: any) {
      throw new Error(
        'Could not establish connection with your Ledger device. Please make sure it is connected via USB.'
      )
    }
  }

  async unlock(path?: ReturnType<typeof getHdPathFromTemplate>, expectedKeyOnThisPath?: string) {
    const pathToUnlock = path || getHdPathFromTemplate(this.hdPathTemplate, 0)

    if (this.isUnlocked(pathToUnlock, expectedKeyOnThisPath)) {
      return 'ALREADY_UNLOCKED'
    }

    if (!this.isWebHID) {
      throw new Error(
        'Ledger only supports USB connection between Ambire and your device. Please connect your device via USB.'
      )
    }

    await this.initAppIfNeeded()
    if (!this.app) {
      throw new Error(
        'Could not establish connection with your Ledger device. Please make sure it is connected via USB.'
      )
    }

    try {
      const response = await this.app.getAddress(
        pathToUnlock,
        false // prioritize having less steps for the user
      )
      this.unlockedPath = pathToUnlock
      this.unlockedPathKeyAddr = response.address

      return 'JUST_UNLOCKED'
    } catch (error: any) {
      const message = error?.message || error?.toString() || 'Ledger device: no response.'

      throw new Error(
        `Could not connect to your Ledger device. Please make sure it is connected, unlocked and running the Ethereum app. \n${message}`
      )
    }
  }

  async cleanUp() {
    this.app = null
    if (this.transport) this.transport.close()
    this.transport = null
    this.hdk = new HDKey()
  }
}

export default LedgerController
