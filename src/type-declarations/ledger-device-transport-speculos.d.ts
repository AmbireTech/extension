declare module '@ledgerhq/device-transport-kit-speculos' {
  // The actual type is compatible with DMK's addTransport; we keep it loose here
  // to avoid coupling our app to the exact transport-kit types.
  export function speculosTransportFactory(url: string): any
}

