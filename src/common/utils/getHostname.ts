function getHostname(url: string) {
  const matches = url?.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/)
  if (matches && matches.length >= 2) {
    return matches[1]
  }
  return null // Return null or handle the case when the URL doesn't match the expected format.
}

export default getHostname
