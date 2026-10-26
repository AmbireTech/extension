export const isOneKeyWebUsbSupported = () => false

export const hasAuthorizedOneKeyDevice = async () => false

const requestOneKeyDevicePermission = async (): Promise<string | undefined> => {
  throw new Error('OneKey WebUSB is unavailable on mobile.')
}

export default requestOneKeyDevicePermission
