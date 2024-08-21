import { signMessage, signMessage712 } from 'adex-protocol-eth/js/Bundle'
import { NetworkType } from 'ambire-common/src/constants/networks'
import useAccSignMsgStatus from 'ambire-common/src/hooks/useAccSignMsgStatus'
import useGetMsgType from 'ambire-common/src/hooks/useGetMsgType'
import useSignedMsgs from 'ambire-common/src/hooks/useSignedMsgs'
import { getNetworkByChainId } from 'ambire-common/src/services/getNetwork'
import { getProvider } from 'ambire-common/src/services/provider'
import { arrayify, isHexString, toUtf8Bytes } from 'ethers/lib/utils'
import { useCallback, useMemo, useState } from 'react'

import { verifyMessage } from '@ambire/signature-validator'
import CONFIG from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import useNetwork from '@common/hooks/useNetwork'
import useStorage from '@common/hooks/useStorage'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import useVault from '@common/modules/vault/hooks/useVault'
import { SIGNER_TYPES } from '@common/modules/vault/services/VaultController/types'
import { fetchPost } from '@common/services/fetch'
import { getWallet } from '@common/services/getWallet/getWallet'

import { UseSignMessageProps, UseSignMessageReturnType } from './types'

function getMessageAsBytes(msg: string) {
  // Transforming human message / hex string to bytes
  if (!isHexString(msg)) {
    return toUtf8Bytes(msg)
  }
  return arrayify(msg)
}

const relayerURL = CONFIG.RELAYER_URL

const useSignMessage = ({
  account,
  messagesToSign,
  resolve,
  onConfirmationCodeRequired,
  openBottomSheetHardwareWallet,
  isInBottomSheet
}: UseSignMessageProps): UseSignMessageReturnType => {
  const { network } = useNetwork()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { signMsgQuickAcc, signMsgExternalSigner, getSignerType } = useVault()

  const [isLoading, setLoading] = useState<boolean>(false)
  const [confirmationType, setConfirmationType] = useState<'email' | 'otp' | null>(null)

  const msgToSign = useMemo(() => messagesToSign[0] || {}, [messagesToSign])
  const dApp = msgToSign.dapp

  const { typeDataErr, requestedChainId, dataV4, isTypedData } = useGetMsgType({ msgToSign })

  const requestedNetwork = getNetworkByChainId(requestedChainId)

  const { addSignedMessage } = useSignedMsgs({ useStorage })

  const { isDeployed, hasPrivileges } = useAccSignMsgStatus({
    fetch,
    addToast,
    accountId: account?.id,
    accountSigner: account?.signer,
    networkId: requestedNetwork?.id as NetworkType['id']
  })

  const handleSigningErr = useCallback(
    (e: any) => {
      if (e && e.message.includes('must provide an Ethereum address')) {
        addToast(
          `Signing error: not connected with the correct address. Make sure you're connected with ${account.signer?.address}.`,
          { error: true }
        )
      } else {
        addToast(`Signing error: ${e.message || e}`, {
          error: true
        })
      }
    },
    [account, addToast]
  )

  const approveWithExternalSigner = useCallback(async () => {
    return signMsgExternalSigner({ account, network, dataV4, msgToSign, isTypedData })
  }, [account, dataV4, isTypedData, msgToSign, network, signMsgExternalSigner])

  const approveQuickAcc = useCallback(
    async ({ code }) => {
      if (!relayerURL) {
        addToast('Email/pass accounts not supported without a relayer connection', {
          error: true
        })
        return
      }

      const { signature, success, message, confCodeRequired } = await fetchPost(
        `${relayerURL}/second-key/${account.id}/ethereum/sign${
          isTypedData ? '?typedData=true' : ''
        }`,
        {
          toSign: isTypedData ? dataV4 : msgToSign.txn,
          code: code || undefined
        }
      )
      if (!success) {
        if (!message) throw new Error('Secondary key: no success but no error message')
        if (message.includes('invalid confirmation code')) {
          addToast('Unable to sign: wrong confirmation code', { error: true })
        }
        addToast(`Second signature error: ${message}`, {
          error: true
        })
        setConfirmationType(null)

        return
      }
      if (confCodeRequired) {
        setConfirmationType(confCodeRequired)

        if (onConfirmationCodeRequired) {
          await onConfirmationCodeRequired(confCodeRequired, approveQuickAcc)
        }

        return
      }

      if (!account.primaryKeyBackup)
        throw new Error(
          'No key backup found: you need to import the account from JSON or login again.'
        )

      return signMsgQuickAcc({ account, network, dataV4, msgToSign, isTypedData, signature })
    },
    [
      account,
      addToast,
      dataV4,
      network,
      signMsgQuickAcc,
      isTypedData,
      onConfirmationCodeRequired,
      msgToSign
    ]
  )

  const approveWithHW = useCallback(
    async ({ device }: { device: any }) => {
      try {

      if (!device) {
        !!openBottomSheetHardwareWallet && openBottomSheetHardwareWallet()
        return
      }

      let wallet
      try {
        // if quick account, wallet = await fromEncryptedBackup
        // and just pass the signature as secondSig to signMsgHash
        wallet = getWallet(
          {
            signer: account.signer,
            signerExtra: account.signerExtra,
            chainId: 1 // does not matter
          },
          device
        )

        if (!wallet) {
          handleSigningErr({ message: 'No wallet found' })
        }
      } catch (walletErr) {
        handleSigningErr(walletErr)
      }

      // It would be great if we could pass the full data cause then web3 wallets/hw wallets can display the full text
      // Unfortunately that isn't possible, because isValidSignature only takes a bytes32 hash; so to sign this with
      // a personal message, we need to be signing the hash itself as binary data such that we match 'Ethereum signed message:\n32<hash binary data>' on the contract

      let sig;
      try {
        sig = await (isTypedData
        ? signMessage712(
            wallet,
            account.id,
            account.signer,
            dataV4.domain,
            dataV4.types,
            dataV4.message
          )
        : signMessage(wallet, account.id, account.signer, getMessageAsBytes(msgToSign.txn)))
      } catch (e) {
        console.log('error signing', e)
        handleSigningErr(e)
      }
      const provider = getProvider(requestedNetwork?.id as NetworkType['id'])
      const isValidSig = await verifyMessage({
        provider,
        signer: account.id,
        message: isTypedData ? null : getMessageAsBytes(msgToSign.txn),
        typedData: isTypedData ? dataV4 : null,
        signature: sig
      })

      return { sig, isValidSig }

    } catch (e) {
      handleSigningErr(e)
      throw e
    }
    },
    [account, dataV4, isTypedData, msgToSign, openBottomSheetHardwareWallet, requestedNetwork?.id]
  )

  // Passing hardware device is required only for the mobile app
  const approve = useCallback(
    async ({ code, device }: { code?: string; device: any }) => {
      setLoading(true)

      let signerType
      try {
        const signerAddr = account.signer?.quickAccManager
          ? account.signer?.one
          : account.signer?.address
        signerType = await getSignerType({ addr: signerAddr })
      } catch (error) {
        signerType = SIGNER_TYPES.hardware
      }

      let approveMsgPromise

      if (signerType === SIGNER_TYPES.quickAcc) {
        approveMsgPromise = approveQuickAcc({ code })
      }

      if (signerType === SIGNER_TYPES.external) {
        approveMsgPromise = approveWithExternalSigner()
      }

      if (signerType === SIGNER_TYPES.hardware || !signerType) {
        approveMsgPromise = approveWithHW({ device })
      }

      approveMsgPromise
        .then((res) => {
          if (res) {
            const { sig, isValidSig } = res
            if (isValidSig) {
              addToast('Signature valid - successfully signed!')
            } else {
              addToast('Invalid signature!', { error: true })
            }

            if (messagesToSign.length === 1 && !isInBottomSheet) {
              navigate(ROUTES.dashboard)
            }

            addSignedMessage({
              accountId: account.id,
              networkId: requestedChainId,
              date: new Date().getTime(),
              typed: isTypedData,
              signer: account.signer,
              message: msgToSign.txn,
              signature: sig,
              dApp
            })
            setLoading(false)
            resolve({ success: true, result: sig })
          }
        })
        .catch((e) => {
          handleSigningErr(e)
          setLoading(false)
        })
    },
    [
      account,
      addToast,
      approveQuickAcc,
      approveWithExternalSigner,
      approveWithHW,
      messagesToSign.length,
      navigate,
      getSignerType,
      handleSigningErr,
      resolve,
      msgToSign,
      isTypedData,
      addSignedMessage,
      dApp,
      requestedChainId,
      isInBottomSheet
    ]
  )

  return {
    approve,
    approveQuickAcc,
    setLoading,
    msgToSign,
    isLoading,
    hasPrivileges,
    typeDataErr,
    isDeployed,
    dataV4,
    requestedNetwork,
    requestedChainId,
    isTypedData,
    confirmationType,
    dApp
  }
}

export default useSignMessage
