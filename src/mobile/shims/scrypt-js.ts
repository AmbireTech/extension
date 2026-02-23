/**
 * Mobile-specific shim for scrypt-js.
 *
 * Redirects scrypt key derivation to react-native-quick-crypto's native
 * C++ (JSI) implementation, avoiding the deeply recursive JS chunking
 * that overflows Hermes's native call stack.
 */
import { scrypt as quickScrypt } from 'react-native-quick-crypto'

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
  return new Promise((resolve, reject) => {
    quickScrypt(password, salt, dkLen, { N, r, p }, (err, derivedKey) => {
      if (err) {
        reject(err)
        return
      }
      resolve(new Uint8Array(derivedKey!))
    })
  })
}
