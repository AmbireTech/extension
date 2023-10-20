import privilegesOptions from 'ambire-common/src/constants/privilegesOptions'
/* eslint-disable no-await-in-loop */
import { Interface } from 'ethers/lib/utils'
import { useState } from 'react'

import i18n from '@common/config/localization/localization'
import useAccounts from '@common/hooks/useAccounts'
import useEOA from '@common/hooks/useEOA'
import useNetwork from '@common/hooks/useNetwork'
import useRequests from '@common/hooks/useRequests'
import useToast from '@common/hooks/useToast'
import { ledgerDeviceGetAddresses } from '@mobile/modules/hardware-wallet/services/ledger'

// eslint-disable-next-line global-require
const IDENTITY_INTERFACE = new Interface(require('adex-protocol-eth/abi/Identity5.2'))

const useHardwareWalletActions = () => {
  const { addToast } = useToast()
  const { selectedAcc } = useAccounts()
  const { addRequest } = useRequests()
  const { network: selectedNetwork } = useNetwork()
  const { onEOASelected } = useEOA()

  // TODO: Multiple signers support is not implemented yet.
  // @ledgerhq/hw-app-eth supports retrieving only a single address
  // once multi-address fetching is supported,
  // a bottom sheet with the address list should be implemented
  const [signersToChoose, setChooseSigners] = useState<any>(null)

  const loginWithSelectedDevice = (addrData: any, signerExtra: any) => {
    if (addrData.addresses.length === 1) {
      onEOASelected(addrData.addresses[0], signerExtra)
    } else {
      setChooseSigners({ addresses: addrData.addresses, signerName: 'Ledger', signerExtra })
    }
  }

  const addAccount = async (device: any) => {
    let error: any = null

    try {
      const addrData = await ledgerDeviceGetAddresses(device)
      if (!addrData.error) {
        const signerExtra = { type: 'ledger', transportProtocol: 'webHID' }

        loginWithSelectedDevice(addrData, signerExtra)
      } else {
        error = addrData.error
      }
    } catch (e: any) {
      if (e.statusCode && e.id === 'InvalidChannel') {
        error = i18n.t('Invalid channel')
      } else if (e.statusCode && e.statusCode === 25873) {
        error = i18n.t('Please make sure your ledger is connected and the ethereum app is open')
      } else {
        error = e.message
      }
    }

    if (error) {
      addToast(i18n.t('Ledger error: {{error}}', { error: error.message || error }) as string, {
        error: true
      })
    }
  }

  const addSigner = async (device: any) => {
    const { addresses, error } = await ledgerDeviceGetAddresses(device)

    if (error) {
      return addToast(error, { error: true })
    }

    const txn = {
      to: selectedAcc,
      data: IDENTITY_INTERFACE.encodeFunctionData('setAddrPrivilege', [
        // Managing multiple signers support is not implemented yet
        // for any hardware wallet. Since the only one currently implemented,
        // Ledger, works with a single address only, select it directly.
        // Once multi-address fetching is supported,
        // a bottom sheet with the address list could be implemented.
        addresses[0],
        privilegesOptions.true
      ]),
      value: '0x00'
    }

    try {
      addRequest({
        id: `setPriv_${txn.data}`,
        dateAdded: new Date().valueOf(),
        type: 'eth_sendTransaction',
        txn,
        chainId: selectedNetwork?.chainId,
        account: selectedAcc
      })
    } catch (err) {
      addToast(`Error: ${err?.message || err}`, { error: true })
    }
  }

  return {
    signersToChoose,
    addAccount,
    addSigner
  }
}

export default useHardwareWalletActions
