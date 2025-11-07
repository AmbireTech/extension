import { browser } from '@web/constants/browserapi'

// Function to determine the file name suffix based on manifest.json icons
const getFileNameSuffix = (): string => {
  try {
    const manifest = browser.runtime.getManifest()
    // Check the first available icon for the "special" path (<type>-build-ONLY)
    const iconToCheck = Object.values(manifest.icons || {})[0] as string

    if (iconToCheck?.includes('-dev-build-ONLY')) return '-dev-build-ONLY'
    if (iconToCheck?.includes('-next-build-ONLY')) return '-next-build-ONLY'
    return '' // Default: no suffix for production build
  } catch (error) {
    console.warn('Failed to read manifest for file name suffix:', error) // no biggie
    return ''
  }
}

export const setExtensionIcon = (type: 'default' | 'locked') => {
  const fileNameSuffix = getFileNameSuffix()

  const icons = [16, 48, 96, 128].reduce((res: { [key: number]: string }, size: number) => {
    const sizeWithSuffix = `${size}${fileNameSuffix}`
    if (type === 'locked') {
      res[size] = `assets/images/xicon_locked@${sizeWithSuffix}.png`
    } else {
      res[size] = `assets/images/xicon@${sizeWithSuffix}.png`
    }

    return res
  }, {})

  return browser.action.setIcon({ path: icons })
}
