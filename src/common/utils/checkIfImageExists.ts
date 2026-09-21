/**
 * How long the check may wait for an answer. The callers show a loading state until it
 * comes, so a request that never answers has to be turned into a "no" by hand.
 */
const REQUEST_TIMEOUT = 5000

/**
 * Check if an image exists or not using the ES6 Fetch API
 * {@link https://stackoverflow.com/a/56196999/1333836}
 */
export const checkIfImageExists = (uri?: string) => {
  if (!uri) return Promise.resolve(false)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  return fetch(uri, {
    // Only retrieves headers, which is enough to check the image existence.
    method: 'HEAD',
    signal: controller.signal
  })
    .then((res) => {
      if (res.ok) return Promise.resolve(true)

      return Promise.resolve(false)
    })
    .catch(() => Promise.resolve(false))
    .finally(() => clearTimeout(timeout))
}
