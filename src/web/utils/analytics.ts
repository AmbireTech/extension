const getExtensionInstanceId = (keystoreUid: string | null, inviteCode: string | null): string => {
  // Valid use-case for accounts with NO keystore yet set up
  if (!keystoreUid || keystoreUid.length < 21) return ''

  return keystoreUid.substring(10, 21) + (inviteCode || '')
}

export { getExtensionInstanceId }
