const privateValue = (
  value: string | undefined | null,
  isPrivacyModeEnabled: boolean,
  characterCount = 6
) => {
  if (!isPrivacyModeEnabled) return value

  return `•`.repeat(characterCount)
}

export { privateValue }
