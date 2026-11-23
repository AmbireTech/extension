type SafeOwnerSigningState = {
  addr: string
  hasSigned: boolean
  isImported: boolean
}

const getSignAndCloseOwnerAddr = (owners: SafeOwnerSigningState[], threshold: number) => {
  const unsignedImportedOwners = owners.filter((owner) => owner.isImported && !owner.hasSigned)
  const [unsignedImportedOwner] = unsignedImportedOwners

  if (unsignedImportedOwners.length !== 1 || !unsignedImportedOwner) return null

  const signedOwnersCount = owners.filter((owner) => owner.hasSigned).length

  return signedOwnersCount + 1 < threshold ? unsignedImportedOwner.addr : null
}

/**
 * Whether the owners that signed already, together with the ones that can sign here, reach the
 * threshold. If not, owners elsewhere have to sign too. True while the threshold isn't loaded
 * (0), so nothing is blocked until it's known
 */
const canOwnersHereMeetThreshold = (owners: SafeOwnerSigningState[], threshold: number) => {
  if (!threshold) return true

  return owners.filter((owner) => owner.isImported || owner.hasSigned).length >= threshold
}

export { canOwnersHereMeetThreshold, getSignAndCloseOwnerAddr }
