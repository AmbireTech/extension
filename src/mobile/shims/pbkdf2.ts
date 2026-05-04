// Replace pbkdf2 from @ethersproject/pbkdf2 with scrypt from react-native-quick-crypto
// written in C++ giving a much better performance on mobile

const quickCrypto = require('react-native-quick-crypto') as any

const isWebView = typeof process !== 'undefined' && process.env.WEB_ENGINE === 'webview'

exports.pbkdf2Sync = quickCrypto.pbkdf2Sync

exports.pbkdf2 = (
  password: any,
  salt: any,
  iterations: number,
  keylen: number,
  digest: string,
  callback: (err: Error | null, derivedKey: Buffer) => void
) => {
  if (isWebView) {
    ;(window as any)
      .sendToRNAsync('crypto.pbkdf2', {
        password,
        salt,
        iterations,
        keylen,
        digest
      })
      .then((res: any) => {
        callback(null, Buffer.from(res))
      })
      .catch((err: any) => {
        callback(err, null as any)
      })
    return
  }

  try {
    const res = quickCrypto.pbkdf2Sync(password, salt, iterations, keylen, digest)
    setImmediate(() => callback(null, res))
  } catch (err: any) {
    setImmediate(() => callback(err, null as any))
  }
}
