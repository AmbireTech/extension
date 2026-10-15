import { normalizePrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'

/**
 * Returns the indexes of every field whose private key is also entered in another field.
 * Keys are compared in their normalized form, so a different `0x` prefix, letter case
 * or surrounding spaces still count as the same key. Empty fields are never duplicates.
 */
export const getDuplicatePrivateKeyIndexes = (privateKeys: { value: string }[]) => {
  const normalizedPrivateKeys = privateKeys.map(({ value }) => normalizePrivateKey(value))

  return normalizedPrivateKeys.reduce<number[]>((duplicateIndexes, privateKey, index) => {
    if (!privateKey) return duplicateIndexes

    const isEnteredInAnotherField = normalizedPrivateKeys.some(
      (otherPrivateKey, otherIndex) => otherIndex !== index && otherPrivateKey === privateKey
    )

    return isEnteredInAnotherField ? [...duplicateIndexes, index] : duplicateIndexes
  }, [])
}
