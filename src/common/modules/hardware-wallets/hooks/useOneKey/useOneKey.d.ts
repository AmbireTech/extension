declare const useOneKey: () => {
  /**
   * Resolves `true` when a OneKey the browser already allowed Ambire to use is plugged in.
   * Otherwise opens the OneKey page in a tab, the only place the browser can ask for access to
   * the device (it brings the user back to the current request once access is granted), and
   * resolves `false`.
   */
  ensureOneKeyAccess: () => Promise<boolean>
}

export default useOneKey
