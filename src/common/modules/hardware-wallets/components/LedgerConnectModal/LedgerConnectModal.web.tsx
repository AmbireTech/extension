// Resolves to the web (WebHID) Ledger connect modal. Lives under common so
// shared sign-message/sign-account-op code can import one path; the actual
// web implementation stays in @web.
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'

export default LedgerConnectModal
