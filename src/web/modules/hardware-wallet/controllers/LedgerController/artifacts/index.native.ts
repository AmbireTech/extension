import { DeviceModelId } from '@ledgerhq/device-management-kit'

// Metro picks this file over `index.ts` on mobile, so the ~1.5 MB of hex load
// scripts never reach the React Native bundle. Sideloading is desktop-only: it
// needs a WebHID session, which mobile doesn't have. If mobile ever gains its
// own sideload transport, drop this file and the artifacts come back for free.
export const AMBIRE_SIGNER_APDUS: Partial<Record<DeviceModelId, string>> = {}
