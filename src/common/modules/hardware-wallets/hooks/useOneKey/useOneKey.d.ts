declare const useOneKey: () => {
  /** Whether a OneKey the browser already allowed Ambire to use is plugged in */
  isOneKeyConnected: boolean
  /**
   * Opens the OneKey page in a tab, the only place the browser can ask for access to the
   * device, and brings the user back to the current request once access is granted.
   */
  openOneKeyAuthorization: () => Promise<void>
}

export default useOneKey
