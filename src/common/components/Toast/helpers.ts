import { ParsedTextLink } from './types'

const DOMAIN_WHITELIST = ['ambire.com']

/**
 * Automatically makes all instances of "contact support" in the text interactive,
 * linking to the support page.
 */
const addInteractiveSupportLinks = (text: string): string => {
  return text
    .split(/(\bcontact support\b)/i)
    .map((part) => {
      if (part.toLowerCase() === 'contact support')
        return `[${part}](https://help.ambire.com/hc/en-us/requests/new)`

      return part
    })
    .join('')
}

/**
 * Parses the text to find links in the format [text](url) and replaces them with
 * interactive Text components that open the link in a new tab when pressed.
 * It also adds support links for "contact support" if present in the text.
 */
export const parseTextLinks = (text: string): (ParsedTextLink | string)[] => {
  const textWithLinks = addInteractiveSupportLinks(text)

  // Find all links in the format [text](url)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  const result = []
  const matches = Array.from(textWithLinks.matchAll(linkRegex)).filter(([, , url]) => {
    try {
      if (!url) return false
      const urlObj = new URL(url)

      // Check if the URL's hostname is in the whitelist
      // Allow subdomains of each allowed domain
      return DOMAIN_WHITELIST.some((domain) => {
        const hostname = urlObj.hostname.toLowerCase()

        return hostname === domain || hostname.endsWith(`.${domain}`)
      })
    } catch (e) {
      return false
    }
  })
  let lastIndex = 0
  let linkIndex = 0

  matches.forEach((match) => {
    const fullMatch = match[0]
    const linkText = match[1]
    const url = match[2]
    const matchIndex = match.index || 0

    // Add text before the match
    if (matchIndex > lastIndex) {
      result.push(textWithLinks.substring(lastIndex, matchIndex))
    }

    // Add the link component
    result.push({
      text: linkText,
      url,
      index: linkIndex
    })

    lastIndex = matchIndex + fullMatch.length
    linkIndex++
  })

  // Add the remaining text after the last match
  if (lastIndex < textWithLinks.length) {
    result.push(textWithLinks.substring(lastIndex))
  }

  // If no links were found return the original text
  return result.length > 0 ? result : [text]
}
