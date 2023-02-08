import { useCallback, useEffect } from 'react'

import useAccounts from '@modules/common/hooks/useAccounts'
import useNetwork from '@modules/common/hooks/useNetwork'
import useStorage from '@modules/common/hooks/useStorage'

import { BROWSER_EXTENSION_REQUESTS_STORAGE_KEY, UseExtensionApprovalReturnType } from './types'

type Props = {
  approval: UseExtensionApprovalReturnType['approval']
  resolveApproval: UseExtensionApprovalReturnType['resolveApproval']
  rejectApproval: UseExtensionApprovalReturnType['rejectApproval']
}

const useSignApproval = ({ approval, resolveApproval, rejectApproval }: Props) => {
  const { selectedAcc: selectedAccount } = useAccounts()
  const { network } = useNetwork()
  const [requests, setRequests] = useStorage({
    key: BROWSER_EXTENSION_REQUESTS_STORAGE_KEY,
    defaultValue: [],
    setInit: (initialRequests) => (!Array.isArray(initialRequests) ? [] : initialRequests)
  })

  // handles eth_sign and personal_sign
  const handleSignText = useCallback(
    async (msg: any, method: string, id: string) => {
      if (!msg) {
        rejectApproval('No msg request to sign', msg)
        return
      }
      if (msg?.[1]?.toLowerCase() !== selectedAccount.toLowerCase()) {
        resolveApproval({
          error: 'Invalid parameters: must use the current user address to sign'
        })
        return
      }

      const messageToSign = msg?.[0]
      if (!messageToSign) {
        rejectApproval('No msg request in received params', msg)
        return
      }

      const request = {
        id,
        type: method,
        reqSrc: BROWSER_EXTENSION_REQUESTS_STORAGE_KEY,
        txn: messageToSign,
        chainId: network?.chainId,
        account: selectedAccount
      }

      // @ts-ignore
      setRequests((prevRequests) =>
        prevRequests.find((x: any) => x.id === request.id)
          ? prevRequests
          : [...prevRequests, request]
      )
    },
    [network?.chainId, selectedAccount, setRequests, rejectApproval, resolveApproval]
  )

  // handles eth_signTypedData, eth_signTypedData_v1, eth_signTypedData_v3 and eth_signTypedData_v4
  const handleSignTypedData = useCallback(
    async (msg: any, method: string, id: string) => {
      if (!msg) {
        rejectApproval('No msg request to sign')
        return
      }
      if (msg?.[0]?.toLowerCase() !== selectedAccount.toLowerCase()) {
        resolveApproval({
          error: 'Invalid parameters: must use the current user address to sign'
        })
        return
      }

      const messageToSign = msg?.[1]
      if (!messageToSign) {
        rejectApproval('No msg request in received params')
        return
      }

      const request = {
        id,
        type: method,
        reqSrc: BROWSER_EXTENSION_REQUESTS_STORAGE_KEY,
        txn: messageToSign,
        chainId: network?.chainId,
        account: selectedAccount
      }

      // @ts-ignore
      setRequests((prevRequests) =>
        prevRequests.find((x: any) => x.id === request.id)
          ? prevRequests
          : [...prevRequests, request]
      )
    },
    [network?.chainId, selectedAccount, setRequests, rejectApproval, resolveApproval]
  )

  const handleSendTransactions = useCallback(
    async (txs: any, method: string, id: string) => {
      if (txs?.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const i in txs) {
          if (!txs[i].from) txs[i].from = selectedAccount
        }
      } else {
        rejectApproval('No txs request in received params', txs)
        return
      }
      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const ix in txs) {
        const request = {
          id,
          type: 'eth_sendTransaction',
          reqSrc: BROWSER_EXTENSION_REQUESTS_STORAGE_KEY,
          isBatch: txs.length > 1,
          txn: txs[ix],
          chainId: network?.chainId,
          account: selectedAccount
        }

        // @ts-ignore
        setRequests((prevRequests) =>
          prevRequests.find((x: any) => x.id === request.id)
            ? prevRequests
            : [...prevRequests, request]
        )
      }
    },
    [network?.chainId, selectedAccount, setRequests, rejectApproval]
  )

  const resolveMany = useCallback(
    (ids, resolution) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const req of requests.filter((r: any) => ids.includes(r.id))) {
        // only process non batch or first batch req
        if (req.id === approval?.id) {
          if (!req.isBatch) {
            if (!resolution) {
              rejectApproval('Nothing to resolve')
            } else if (!resolution.success) {
              rejectApproval(resolution.message)
            } else {
              // onSuccess
              resolveApproval({
                hash: resolution.result
              })
            }
          }
        }
      }
      // @ts-ignore
      setRequests((prevRequests) => prevRequests.filter((x) => !ids.includes(x.id)))
    },
    [requests, approval?.id, setRequests, rejectApproval, resolveApproval]
  )

  useEffect(() => {
    if (approval) {
      const method = approval?.data?.params?.method
      const params = approval?.data?.params?.data
      const approvalId = approval?.id

      if (
        ['eth_sendTransaction', 'gs_multi_send', 'ambire_sendBatchTransaction'].includes(method)
      ) {
        handleSendTransactions(params, method, approvalId)
      }
      if (['personal_sign', 'eth_sign'].includes(method)) {
        handleSignText(params, method, approvalId)
      }
      if (
        [
          'eth_signTypedData',
          'eth_signTypedData_v1',
          'eth_signTypedData_v3',
          'eth_signTypedData_v4'
        ].includes(method)
      ) {
        handleSignTypedData(params, method, approvalId)
      }
    }
  }, [approval, handleSendTransactions, handleSignText, handleSignTypedData])

  return {
    requests,
    resolveMany
  }
}

export default useSignApproval
