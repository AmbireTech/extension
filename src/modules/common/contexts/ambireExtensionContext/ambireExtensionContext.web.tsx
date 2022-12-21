import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import useAccounts from '@modules/common/hooks/useAccounts'
import useNetwork from '@modules/common/hooks/useNetwork'
import useStorage from '@modules/common/hooks/useStorage'
import { browserAPI } from '@web/constants/browserAPI'
import { errorCodes } from '@web/constants/errors'
import { BACKGROUND, CONTENT_SCRIPT } from '@web/constants/paths'
import { USER_INTERVENTION_METHODS } from '@web/constants/userInterventionMethods'
import { sendMessage, setupAmbexMessenger } from '@web/services/ambexMessanger'

import { ambireExtensionContextDefaults, AmbireExtensionContextReturnType } from './types'

const AmbireExtensionContext = createContext<AmbireExtensionContextReturnType>(
  ambireExtensionContextDefaults
)
const WORKER_KEEP_ALIVE_INTERVAL = 1000
const WORKER_KEEP_ALIVE_MESSAGE = 'WORKER_KEEP_ALIVE_MESSAGE'
const STORAGE_KEY = 'ambire_extension_state'

// TODO: should be called only for extension. Skip if this code is used for web wallet
!!setupAmbexMessenger && setupAmbexMessenger(CONTENT_SCRIPT, browserAPI)

const AmbireExtensionProvider: React.FC = ({ children }) => {
  const { selectedAcc: selectedAccount } = useAccounts()
  const { network } = useNetwork()

  const [connectedDapps, setConnectedDapps] = useState<
    {
      host: string
      status: boolean
    }[]
  >([])
  const [params, setParams] = useState<{
    route?: string
    host?: string
    queue?: string
  }>({})
  const [lastActiveTab, setLastActiveTab] = useState<any>(null)
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
            rpcResult.error = { code: errorCodes.rpc.methodNotFound, message: 'Nothing to resolve' }
            rpcResult.success = false
          } else if (!resolution.success) {
            rpcResult.error = resolution
            rpcResult.success = false
          } else {
            // onSuccess
            rpcResult.success = true
            rpcResult.txId = resolution.result
            rpcResult.hash = resolution.result
            rpcResult.result = resolution.result
          }

          !!sendMessage &&
            sendMessage({
              type: 'web3CallResponse',
              to: BACKGROUND,
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

  const disconnectDapp = useCallback(
    (host: string) => {
      sendMessage({
        to: BACKGROUND,
        type: 'removeFromPermissionsList',
        data: { host }
      }).then(() => {
        setConnectedDapps(connectedDapps.filter((p) => p.host !== host))
      })
    },
    [connectedDapps]
  )

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

  useEffect(() => {
    if (!isTempExtensionPopup) {
      !!sendMessage &&
        sendMessage({
          to: BACKGROUND,
          type: 'getPermissionsList'
        }).then((reply) => {
          setConnectedDapps(
            Object.keys(reply.data).map((host) => {
              return {
                host,
                status: reply.data?.[host]
              }
            })
          )
        })
    }
  }, [isTempExtensionPopup])

  useEffect(() => {
    let interval: any
    if (browserAPI.tabs) {
      browserAPI.tabs.query(
        {
          active: true,
          currentWindow: true
        },
        ([currentTab]) => {
          setLastActiveTab(currentTab)
        }
      )
      /*
       * As long as UI is open it will keep sending messages to service worker
       * In service worker as this message is received
       * if service worker is inactive it is reactivated and script re-loaded
       * Time has been kept to 1000ms but can be reduced for even faster re-activation of service worker
       */
      interval = setInterval(() => {
        browserAPI.runtime.sendMessage({ name: WORKER_KEEP_ALIVE_MESSAGE })
      }, WORKER_KEEP_ALIVE_INTERVAL)
    }

    return () => {
      clearInterval(interval)
    }
  }, [])

  return (
    <AmbireExtensionContext.Provider
      value={useMemo(
        () => ({
          connectedDapps,
          params,
          requests,
          isTempExtensionPopup,
          lastActiveTab,
          resolveMany,
          setParams,
          disconnectDapp
        }),
        [
          connectedDapps,
          params,
          requests,
          isTempExtensionPopup,
          lastActiveTab,
          resolveMany,
          setParams,
          disconnectDapp
        ]
      )}
    >
      {children}
    </AmbireExtensionContext.Provider>
  )
}

export { AmbireExtensionContext, AmbireExtensionProvider }
