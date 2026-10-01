export declare const isOneKeyWebUsbSupported: () => boolean

declare const requestOneKeyDevicePermission: () => Promise<string | undefined>

export default requestOneKeyDevicePermission
