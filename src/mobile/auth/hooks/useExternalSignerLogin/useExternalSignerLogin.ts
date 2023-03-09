import { Wallet } from 'ethers'
import { useCallback } from 'react'
import { Keyboard } from 'react-native'

import { isWeb } from '@common/config/env'
import useEOA from '@common/hooks/useEOA'
import useToast from '@common/hooks/useToast'
import useVault from '@mobile/vault/hooks/useVault'

type AddSignerFormValues = {
  signer: string
}

const useExternalSignerLogin = () => {
  const { addToast } = useToast()
  const { addToVault } = useVault()
  const { onEOASelected } = useEOA()

  // Add new Ambire account or login with an existing one
  // default signer of the account will be the passed external private key
  const addExternalSigner = useCallback(
    async ({ signer }: AddSignerFormValues) => {
      try {
        if (!signer) {
          !isWeb && Keyboard.dismiss()
          addToast('Signer can not be empty.', {
            error: true,
            timeout: 4000
          })
          return
        }

        const wallet = new Wallet(signer)

        if (!wallet) {
          !isWeb && Keyboard.dismiss()
          addToast('Incorrect private key format.', {
            error: true,
            timeout: 4000
          })
          return
        }

        // the public addr of the signer
        const addr = await wallet.getAddress()

        await addToVault({
          addr,
          item: {
            signer: wallet.privateKey,
            type: 'external'
          }
        })

        await onEOASelected(addr, { type: 'Web3' })
      } catch (e) {
        !isWeb && Keyboard.dismiss()
        addToast(e.message || e, {
          error: true,
          timeout: 4000
        })
      }
    },
    [onEOASelected, addToast, addToVault]
  )

  return {
    addExternalSigner
  }
}

export default useExternalSignerLogin
