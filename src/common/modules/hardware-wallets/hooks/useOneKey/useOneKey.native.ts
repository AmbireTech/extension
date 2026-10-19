// OneKey is supported in the browser extension only. Kept at module level, so the same
// function is returned on every render and doesn't break the memoization of its callers
const ONE_KEY_UNSUPPORTED = {
  ensureOneKeyAccess: async () => false
}

const useOneKey = () => ONE_KEY_UNSUPPORTED

export default useOneKey
