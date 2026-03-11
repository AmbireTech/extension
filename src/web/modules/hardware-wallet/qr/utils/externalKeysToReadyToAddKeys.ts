import { ExternalKey, ReadyToAddKeys } from '@ambire-common/interfaces/keystore'

export function externalKeysToReadyToAddKeys(externalKeys: ExternalKey[]): ReadyToAddKeys {
  return {
    internal: [],
    external: externalKeys.map((key) => ({
      addr: key.addr,
      label: key.label,
      type: key.type,
      dedicatedToOneSA: key.dedicatedToOneSA,
      meta: key.meta
    }))
  }
}
