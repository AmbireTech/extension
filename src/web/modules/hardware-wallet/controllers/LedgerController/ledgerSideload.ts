import { Subscription } from 'rxjs'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { normalizeLedgerMessage } from '@ambire-common/libs/ledger/ledger'
import { isLedgerEmulator, LEDGER_EMULATOR_HTTP_URL } from '@common/config/env'
import {
  DeviceManagementKitBuilder,
  DeviceModelId,
  DiscoveredDevice,
  isSuccessCommandResult,
  ListAppsCommand
} from '@ledgerhq/device-management-kit'
import { speculosTransportFactory } from '@ledgerhq/device-transport-kit-speculos'
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid'

import { getInstallErrorMessage, isSuccessStatusWord, parseLedgerAppApdus } from './ledgerAppLoader'
import {
  ecdhSharedSecret,
  LedgerScp,
  publicKeyUncompressed,
  randomNonce,
  randomScalarHex,
  signSha256Der
} from './ledgerScp'

const CLA = 0xe0
const INS_SECURE = 0x00
const INS_GET_VERSION = 0x01
const INS_VALIDATE_TARGET_ID = 0x04
const INS_INITIALIZE_AUTHENTICATION = 0x50
const INS_VALIDATE_CERTIFICATE = 0x51
const INS_GET_CERTIFICATE = 0x52
const INS_MUTUAL_AUTHENTICATE = 0x53

const CERT_ROLE_SIGNER = 0x01
const CERT_ROLE_SIGNER_EPHEMERAL = 0x11

// Long enough for the user to approve the on-device "allow unknown manager" prompt.
const APDU_TIMEOUT = 90_000

/**
 * What the install is waiting on, so the UI can tell the user what to do. Most
 * of the wall time is spent on the two on-device approvals, not on the transfer,
 * and the device gives no hint on screen about which one belongs to us.
 */
export type LedgerAppInstallStep =
  | 'connecting'
  | 'confirmingAppList'
  | 'confirmingInstall'
  | 'loading'

const concatBytes = (...arrays: Uint8Array[]) => {
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0))
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

// Ledger's length-prefixed framing: a single length byte followed by the value.
const serialize = (value: Uint8Array): Uint8Array => concatBytes(Uint8Array.of(value.length), value)

const unserialize = (buffer: Uint8Array): [Uint8Array, Uint8Array] => {
  const length = buffer[0]!
  return [buffer.slice(1, 1 + length), buffer.slice(1 + length)]
}

/**
 * Sideloads a custom Ledger app (the "Ambire Signer" EIP-7702 delegation app)
 * by opening an SCP v2 secure channel and replaying the app's load script
 * through it. Runs its own foreground DMK session (like
 * `LedgerController.grantDevicePermissionIfNeeded`) because installing an app is
 * a one-off, dashboard-level operation separate from the signing session.
 *
 * No custom CA is used: a fresh signer key makes the device show the "allow
 * unknown manager" prompt the user must approve. Requires the WebHID permission
 * to already be granted and the device to be on the dashboard.
 *
 * Resolves with `true` when the app was already on the device and nothing was
 * installed, `false` when it was actually installed. `onProgress` reports which
 * step is in flight, plus a percentage that only moves during 'loading'.
 */
export const installLedgerApp = async (
  appName: string,
  apdusByModel: Partial<Record<DeviceModelId, string>>,
  onProgress: (step: LedgerAppInstallStep, percent: number) => void
): Promise<boolean> => {
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
    const connectedModel = dmk.getConnectedDevice({ sessionId }).modelId

    // Bail out before touching the secure channel when the app is already on the
    // device. Reaching CREATE_APP with a name the device already holds makes it
    // offer to UNINSTALL the app, which is the last thing we want to put in front
    // of someone who just wanted to check. Listing costs one on-device approval
    // ("share list of installed apps"), which the firmware always asks for - it
    // is read-only and destroys nothing, unlike the alternative.
    // ponytail: if listing fails (device not on its home screen), fall through -
    // the very next command hits the same condition and maps it to a clear error.
    onProgress('confirmingAppList', 0)
    const installedApps: string[] = []
    for (let isContinue = false; ; isContinue = true) {
      const listResult = await dmk.sendCommand({
        sessionId,
        command: new ListAppsCommand({ isContinue }),
        abortTimeout: APDU_TIMEOUT
      })
      if (!isSuccessCommandResult(listResult) || !listResult.data.length) break
      installedApps.push(...listResult.data.map((app) => app.appName))
    }
    if (installedApps.includes(appName)) return true

    // Nano X firmware forbids sideloading custom apps (returns 0x5120); Nano S
    // Plus, Stax and Flex allow it. Fail early with a clear message on real Nano
    // X hardware (the Speculos emulator has no such restriction).
    if (!isLedgerEmulator && connectedModel === DeviceModelId.NANO_X)
      throw new ExternalSignerError(
        'Sideloading apps is not supported on the Ledger Nano X. Use a Nano S Plus, Stax, Flex, or newer device.'
      )

    const apduDump = apdusByModel[connectedModel]
    if (!apduDump)
      throw new ExternalSignerError(
        'No Ambire Signer build is available for your Ledger model yet.'
      )

    const commands = parseLedgerAppApdus(apduDump)

    const exchange = async (
      ins: number,
      data: Uint8Array = new Uint8Array(0),
      p1 = 0,
      p2 = 0
    ): Promise<Uint8Array> => {
      const apdu = concatBytes(Uint8Array.of(CLA, ins, p1, p2, data.length), data)
      const { statusCode, data: response } = await dmk.sendApdu({
        sessionId,
        apdu,
        abortTimeout: APDU_TIMEOUT
      })
      if (!isSuccessStatusWord(statusCode))
        throw new ExternalSignerError(getInstallErrorMessage(statusCode))

      return response
    }

    // 1) Read + validate the target id (required to open the secure channel).
    onProgress('confirmingInstall', 0)
    const versionInfo = await exchange(INS_GET_VERSION)
    const targetId = new Uint8Array(versionInfo.slice(0, 4))
    await exchange(INS_VALIDATE_TARGET_ID, targetId)

    // 2) SCP v2 mutual authentication. With no custom CA we present a fresh
    //    signer key, so the device shows the "allow unknown manager" prompt.
    const serverNonce = randomNonce(8)
    const initResponse = await exchange(INS_INITIALIZE_AUTHENTICATION, serverNonce)
    const deviceNonce = initResponse.slice(4, 12)

    const masterPrivHex = randomScalarHex()
    const masterPublicKey = publicKeyUncompressed(masterPrivHex)
    const ephemeralPrivHex = randomScalarHex()
    const ephemeralPublicKey = publicKeyUncompressed(ephemeralPrivHex)

    const signerCertificate = concatBytes(
      serialize(masterPublicKey),
      serialize(
        signSha256Der(masterPrivHex, concatBytes(Uint8Array.of(CERT_ROLE_SIGNER), masterPublicKey))
      )
    )
    const ephemeralCertificate = concatBytes(
      serialize(ephemeralPublicKey),
      serialize(
        signSha256Der(
          masterPrivHex,
          concatBytes(
            Uint8Array.of(CERT_ROLE_SIGNER_EPHEMERAL),
            serverNonce,
            deviceNonce,
            ephemeralPublicKey
          )
        )
      )
    )
    await exchange(INS_VALIDATE_CERTIFICATE, signerCertificate, 0x00)
    await exchange(INS_VALIDATE_CERTIFICATE, ephemeralCertificate, 0x80)

    await exchange(INS_GET_CERTIFICATE, new Uint8Array(0), 0x00)
    const deviceEphemeralCertificate = await exchange(INS_GET_CERTIFICATE, new Uint8Array(0), 0x80)
    // Certificate layout: serialize(header) + serialize(publicKey) + serialize(signature).
    // ponytail: we don't verify the device's certificate chain (ledgerctl does).
    // The channel's confidentiality comes from the ECDH with the device ephemeral
    // key; over a direct WebHID link there is no MITM to defend against. Add
    // verification if this ever runs over an untrusted transport.
    const [, afterHeader] = unserialize(deviceEphemeralCertificate)
    const [deviceEphemeralPublicKey] = unserialize(afterHeader)
    if (deviceEphemeralPublicKey.length !== 65)
      throw new ExternalSignerError('Unexpected device certificate during secure channel setup.')

    const sharedSecret = ecdhSharedSecret(ephemeralPrivHex, deviceEphemeralPublicKey)
    await exchange(INS_MUTUAL_AUTHENTICATE)
    const scp = new LedgerScp(sharedSecret)

    // 3) Replay the app's load script through the secure channel. Each dump line
    //    is `E0 00 00 00 <Lc> <secureIns||data>`; we wrap the payload and send it
    //    as a SECURE APDU. Unwrapping each response keeps the SCP IV state in sync.
    for (let i = 0; i < commands.length; i += 1) {
      const payload = commands[i]!.slice(5)
      const response = await exchange(INS_SECURE, scp.wrap(payload))
      scp.unwrap(response)
      onProgress('loading', Math.round(((i + 1) / commands.length) * 100))
    }

    return false
  } catch (e: any) {
    if (e instanceof ExternalSignerError) throw e
    throw new ExternalSignerError(normalizeLedgerMessage(e?.message))
  } finally {
    dmk.close()
  }
}
