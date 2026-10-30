import { Subscription } from 'rxjs'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import { isLedgerEmulator, LEDGER_EMULATOR_HTTP_URL } from '@common/config/env'
import {
  installLedgerAppOverSession,
  LedgerAppInstallStep
} from '@common/modules/hardware-wallet/libs/ledgerAppInstall/installLedgerApp'
import {
  DeviceManagementKitBuilder,
  DeviceModelId,
  DiscoveredDevice
} from '@ledgerhq/device-management-kit'
import { speculosTransportFactory } from '@ledgerhq/device-transport-kit-speculos'
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid'

export type { LedgerAppInstallStep }

/**
 * Sideloads a custom Ledger app (the "Ambire Signer" EIP-7702 delegation app)
 * over WebHID; the protocol itself lives in `installLedgerAppOverSession`. Runs
 * its own foreground DMK session (like
 * `LedgerController.grantDevicePermissionIfNeeded`) because installing an app is
 * a one-off, dashboard-level operation separate from the signing session.
 *
 * Requires the WebHID permission to already be granted and the device to be on
 * the dashboard.
 */
export const installLedgerApp = async (
  apdusByModel: Partial<Record<DeviceModelId, string>>,
  onProgress: (step: LedgerAppInstallStep, percent: number) => void
): Promise<void> => {
  const dmk = new DeviceManagementKitBuilder()
    .addTransport(
      isLedgerEmulator ? speculosTransportFactory(LEDGER_EMULATOR_HTTP_URL) : webHidTransportFactory
    )
    .build()

  try {
    onProgress('connecting', 0)
    const device = await new Promise<DiscoveredDevice>((resolve, reject) => {
      let subscription: Subscription | undefined
      subscription = dmk.listenToAvailableDevices({}).subscribe({
        next: (devices) => {
          if (!devices?.length) return
          subscription?.unsubscribe()
          resolve(devices[0]!)
        },
        error: (error) => {
          subscription?.unsubscribe()
          reject(new Error(error?.message))
        }
      })
    })

    const sessionId = await dmk.connect({ device })

    await installLedgerAppOverSession({
      sendApdu: ({ apdu, abortTimeout }) => dmk.sendApdu({ sessionId, apdu, abortTimeout }),
      modelId: dmk.getConnectedDevice({ sessionId }).modelId,
      apdusByModel,
      onProgress,
      isEmulator: isLedgerEmulator
    })
  } catch (e: any) {
    if (e instanceof ExternalSignerError) throw e
    throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
  } finally {
    dmk.close()
  }
}
