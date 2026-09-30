// Replace pbkdf2 from @ethersproject/pbkdf2 with scrypt from react-native-quick-crypto
// written in C++ giving a much better performance on mobile

const quickCrypto = require('react-native-quick-crypto') as any

exports.pbkdf2Sync = quickCrypto.pbkdf2Sync

exports.pbkdf2 = (
  password: any,
  salt: any,
  iterations: number,
  keylen: number,
  digest: string,
  callback: (err: Error | null, derivedKey: Buffer) => void
) => {
  try {
    const res = quickCrypto.pbkdf2Sync(password, salt, iterations, keylen, digest)
    setImmediate(() => callback(null, res))
  } catch (err: any) {
    setImmediate(() => callback(err, null as any))
  }
}
