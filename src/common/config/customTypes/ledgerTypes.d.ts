/**
 * TODO: Ledger types are not being resolved correctly.
 *   1. The package has an incorrect build output structure with a nested package.json
 *   in the lib/esm directory that's causing module resolution issues
 *   2. The nested package.json contains workspace references and incorrect export paths
 *   3. The build process needs to be fixed to:
 *     - Not copy the package.json into the build output
 *     - Properly structure the built files without nested package.json files
 *     - Ensure type declarations are properly referenced
 *     - Fix the export paths in the main package.json
 * As a temporary workaround, fixing the types manually here.
 */
declare module '@ledgerhq/device-signer-kit-ethereum' {
  export * from '@ledgerhq/device-signer-kit-ethereum/lib/types'
}
declare module '@ledgerhq/context-module' {
  export * from '@ledgerhq/context-module/lib/types'
}
declare module '@ledgerhq/device-management-kit' {
  export * from '@ledgerhq/device-management-kit/lib/types'
}
declare module '@ledgerhq/device-transport-kit-web-hid' {
  export * from '@ledgerhq/device-transport-kit-web-hid/lib/types'
}
declare module '@ledgerhq/device-transport-kit-speculos' {
  export * from '@ledgerhq/device-transport-kit-speculos/lib/types'
}
