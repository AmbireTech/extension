import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import useAccounts from '@modules/common/hooks/useAccounts'
import useNetwork from '@modules/common/hooks/useNetwork'
import useStorage from '@modules/common/hooks/useStorage'
import useToast from '@modules/common/hooks/useToast'
import { browserAPI } from '@web/constants/browserAPI'
import { USER_INTERVENTION_METHODS } from '@web/constants/userInterventionMethods'
import { sendMessage, setupAmbexMessenger } from '@web/services/ambexMessanger'

export interface AmbireExtensionContextReturnType {
  params: {
    route?: string
    host?: string
    queue?: string
  }
  requests: any[] | null
  resolveMany: (ids: any, resolution: any) => any
  setParams: React.Dispatch<
    React.SetStateAction<{
      route?: string
      host?: string
      queue?: string
    }>
  >
  isTempExtensionPopup: boolean
}

const AmbireExtensionContext = createContext<AmbireExtensionContextReturnType>({
  params: {},
  requests: [],
  resolveMany: () => {},
  setParams: () => null,
  isTempExtensionPopup: false
})

const STORAGE_KEY = 'ambire_extension_state'

// TODO: should be called only for extension. Skip if this code is used for web wallet
setupAmbexMessenger('contentScript', browserAPI)

const AmbireExtensionProvider: React.FC = ({ children }) => {
  const { selectedAcc: selectedAccount } = useAccounts()
  const { network } = useNetwork()
  const { addToast } = useToast()
  const [params, setParams] = useState<{
    route?: string
    host?: string
    queue?: string
  }>({})
  const isTempExtensionPopup = useMemo(() => !!params.route || !!params.host, [params])
  const queue = useMemo(() => (params.queue ? JSON.parse(atob(params.queue)) : []), [params.queue])

  const [requests, setRequests] = useStorage({
    key: STORAGE_KEY,
    defaultValue: [],
    setInit: (initialRequests) => (!Array.isArray(initialRequests) ? [] : initialRequests)
  })

  // eth_sign, personal_sign
  const handlePersonalSign = useCallback(
    async (message) => {
      const payload = message.data

      if (!payload) {
        console.error('AmbExHook: no payload', message)
        return
      }

      const id = `ambex_${payload.id}`
      let messageToSign = payload?.params?.message || payload?.params[0]
      if (
        payload.method === USER_INTERVENTION_METHODS.eth_sign ||
        payload.method === USER_INTERVENTION_METHODS.eth_signTypedData ||
        payload.method === USER_INTERVENTION_METHODS.eth_signTypedData_v4
      ) {
        messageToSign = payload?.params[1]
      }
      if (!messageToSign) {
        console.error('AmbExHook: no message in received payload')
        return
      }

      const request = {
        id,
        originalPayloadId: payload.id, // id for internal ambire requests purposes, originalPayloadId, to return
        type: payload.method,
        txn: messageToSign,
        chainId: network?.chainId,
        account: selectedAccount,
        originalMessage: message
      }

      setRequests((prevRequests) =>
        prevRequests.find((x) => x.id === request.id) ? prevRequests : [...prevRequests, request]
      )
    },
    [network?.chainId, selectedAccount, setRequests]
  )

  // handleSendTx
  const handleSendTransactions = useCallback(
    async (message) => {
      const payload = message.data
      const txs = payload.params
      if (txs?.length) {
        // eslint-disable-next-line no-restricted-syntax
        for (const i in txs) {
          if (!txs[i].from) txs[i].from = selectedAccount
        }
      } else {
        throw Error('No txs in received payload')
      }

      // eslint-disable-next-line no-restricted-syntax, guard-for-in
      for (const ix in txs) {
        const internalHookId = `ambex_tx_${payload.id}:${ix}`
        const request = {
          id: internalHookId,
          originalPayloadId: payload.id,
          type: 'eth_sendTransaction',
          isBatch: txs.length > 1,
          txn: txs[ix],
          chainId: network?.chainId,
          account: selectedAccount,
          originalMessage: message
        }
        // Do we need reducer here or enough like this?
        setRequests((prevRequests) =>
          prevRequests.find((x) => x.id === request.id) ? prevRequests : [...prevRequests, request]
        )
      }
    },
    [network?.chainId, selectedAccount, setRequests]
  )

  const resolveMany = useCallback(
    (ids, resolution) => {
      // eslint-disable-next-line no-restricted-syntax
      for (const req of requests.filter((x) => ids.includes(x.id))) {
        // only process non batch or first batch req
        if (!req.isBatch || req.id.endsWith(':0')) {
          const rpcResult: any = {
            jsonrpc: '2.0',
            id: req.originalPayloadId,
            txId: null,
            hash: null,
            result: null,
            success: null,
            error: null
          }

          if (!resolution) {
            rpcResult.error = { message: 'Nothing to resolve' }
            rpcResult.success = false
          } else if (!resolution.success) {
            rpcResult.error = { message: resolution.message }
            rpcResult.success = false
          } else {
            // onSuccess
            rpcResult.success = true
            rpcResult.txId = resolution.result
            rpcResult.hash = resolution.result
            rpcResult.result = resolution.result
          }

          sendMessage({
            type: 'web3CallResponse',
            to: 'background',
            data: {
              originalMessage: req.originalMessage,
              rpcResult
            }
          })
        }
      }
      setRequests((prevRequests) => prevRequests.filter((x) => !ids.includes(x.id)))
    },
    [requests, setRequests]
  )

  useEffect(() => {
    if (selectedAccount && network) {
      browserAPI.storage.local.set({ SELECTED_ACCOUNT: selectedAccount, NETWORK: network })
    }
  }, [selectedAccount, network, addToast])

  useEffect(() => {
    const message = queue[0]
    if (message) {
      if (
        params.route === USER_INTERVENTION_METHODS.eth_sendTransaction ||
        params.route === USER_INTERVENTION_METHODS.gs_multi_send ||
        params.route === USER_INTERVENTION_METHODS.ambire_sendBatchTransaction
      ) {
        handleSendTransactions(message)
      }
      if (
        params.route === USER_INTERVENTION_METHODS.eth_sign ||
        params.route === USER_INTERVENTION_METHODS.personal_sign ||
        params.route === USER_INTERVENTION_METHODS.eth_signTypedData ||
        params.route === USER_INTERVENTION_METHODS.eth_signTypedData_v4
      ) {
        handlePersonalSign(message)
      }
    }
  }, [params, queue, handleSendTransactions, handlePersonalSign])

  return (
    <AmbireExtensionContext.Provider
      value={useMemo(
        () => ({
          params,
          requests,
          isTempExtensionPopup,
          resolveMany,
          setParams
        }),
        [params, requests, isTempExtensionPopup, resolveMany, setParams]
      )}
    >
      {children}
    </AmbireExtensionContext.Provider>
  )
}

export { AmbireExtensionContext, AmbireExtensionProvider }
