import { Buffer } from 'buffer'
import { createMMKV } from 'react-native-mmkv'

import type { PairingStorage } from 'keycard-sdk/dist/pairing-storage'

// Keycards with applet version < 4.0 must be paired with the app before a secure
// channel can be opened. A card has a handful of pairing slots only, so the
// pairing blob has to be persisted and reused on every following tap - otherwise
// each tap would burn a slot until the card refuses to pair at all.
//
// The blob is not a wallet secret: it is a per-app-per-card channel key. It cannot
// derive keys or sign anything - the PIN, which is never stored, is still required
// for every operation.
const pairingStorageInstance = createMMKV({ id: 'keycardPairings' })

const getStorageKey = (instanceUID: Uint8Array) => Buffer.from(instanceUID).toString('hex')

const keycardPairingStorage: PairingStorage = {
  putPairing: async (instanceUID: Uint8Array, pairing: string) => {
    pairingStorageInstance.set(getStorageKey(instanceUID), pairing)
  },
  getPairing: async (instanceUID: Uint8Array) => {
    return pairingStorageInstance.getString(getStorageKey(instanceUID)) ?? null
  },
  deletePairing: async (instanceUID: Uint8Array) => {
    pairingStorageInstance.remove(getStorageKey(instanceUID))
  }
}

export default keycardPairingStorage
