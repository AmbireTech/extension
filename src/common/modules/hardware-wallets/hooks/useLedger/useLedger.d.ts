declare const useLedger: () => {
  requestLedgerDeviceAccess: () => Promise<void>
  isLedgerConnected: boolean
  setIsLedgerConnected: (value: boolean) => void
}

export default useLedger
