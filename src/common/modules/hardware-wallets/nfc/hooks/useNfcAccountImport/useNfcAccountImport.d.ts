import { NfcWalletType } from '@ambire-common/interfaces/keystore'

declare const useNfcAccountImport: () => {
  scanCard: (nfcWalletType: NfcWalletType) => void
}

export default useNfcAccountImport
