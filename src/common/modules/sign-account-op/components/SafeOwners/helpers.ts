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

export { getSignAndCloseOwnerAddr }
