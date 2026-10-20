export declare const isOneKeyWebUsbSupported: () => boolean

/**
 * Whether a OneKey the browser already allowed Ambire to use is plugged in.
 */
export declare const hasAuthorizedOneKeyDevice: () => Promise<boolean>

declare const requestOneKeyDevicePermission: () => Promise<string | undefined>

export default requestOneKeyDevicePermission
