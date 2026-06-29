// Resolves to the mobile (BLE) Ledger connect modal. Lives under common so
// shared sign-message/sign-account-op code can import one path; the actual
// mobile implementation stays in @mobile.
import LedgerConnectModal from '@mobile/modules/hardware-wallet/components/LedgerConnectModal'

export default LedgerConnectModal
