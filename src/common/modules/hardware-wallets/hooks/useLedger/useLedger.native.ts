const useLedger = () => {
  return {
    requestLedgerDeviceAccess: () => {},
    isLedgerConnected: false,
    setIsLedgerConnected: () => {}
  }
}

export default useLedger
