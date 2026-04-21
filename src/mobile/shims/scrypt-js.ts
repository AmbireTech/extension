/**
 * Mobile-specific shim for scrypt-js.
 *
 * Redirects scrypt key derivation to react-native-quick-crypto's native
 * C++ (JSI) implementation, avoiding the deeply recursive JS chunking
 * that overflows Hermes's native call stack.
 */
// Use require instead of ES import to prevent Webpack warnings about missing 
// named exports when react-native-quick-crypto is aliased to crypto-browserify
const quickCrypto = require('react-native-quick-crypto')

// 256 MB — covers N=131072, r=8 which needs 128*N*r = 128 MB
const isWebView = typeof process !== 'undefined' && process.env.WEB_ENGINE === 'webview'
// 256 MB — covers N=131072, r=8 which needs 128*N*r = 128 MB
const MAX_MEM = 256 * 1024 * 1024

/**
 * Compatible with the scrypt-js export signature:
 *   scrypt(password, salt, N, r, p, dkLen, progressCallback?) => Promise<Uint8Array>
 */
export async function scrypt(
  password: Uint8Array,
  salt: Uint8Array,
  N: number,
  r: number,
  p: number,
  dkLen: number,
  _progressCallback?: (progress: number) => void
): Promise<Uint8Array> {
  if (isWebView) {
    return (window as any).sendToRNAsync('crypto.scrypt', {
      password,
      salt,
      N,
      r,
      p,
      dkLen
    }).then((res: any) => new Uint8Array(res))
  }

  return new Promise((resolve, reject) => {
    try {
      quickCrypto.scrypt(password as any, salt as any, dkLen, { N, r, p, maxmem: MAX_MEM }, ((
        err: Error | null,
        derivedKey?: any
      ) => {
        if (err) {
          reject(err)
          return
        }
        resolve(new Uint8Array(derivedKey!))
      }) as any)
    } catch (e: any) {
      reject(e)
    }
  })
}

/**
 * Synchronous variant — used by some scrypt-js callers.
 */
export function syncScrypt(
  password: Uint8Array,
  salt: Uint8Array,
  N: number,
  r: number,
  p: number,
  dkLen: number
): Uint8Array {
  const result = quickCrypto.scryptSync(password as any, salt as any, dkLen, { N, r, p, maxmem: MAX_MEM })
  return new Uint8Array(result)
}

// ethers.js explicitly requires a default export from scrypt-js
export default { scrypt, syncScrypt }
