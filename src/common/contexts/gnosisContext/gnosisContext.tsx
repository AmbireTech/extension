/* eslint-disable guard-for-in */
import { getProvider } from 'ambire-common/src/services/provider'
/* eslint-disable no-restricted-syntax */
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import useRequests from '@common/hooks/useRequests'
import useStorage from '@common/hooks/useStorage'
import { getSDKVersion, MessageFormatter, Methods } from '@gnosis.pm/safe-apps-sdk'

export interface GnosisContextReturnType {
  sushiSwapIframeRef: React.RefObject<any> | null
  hash: string
  requests: any[] | null
  resolveMany: (ids: any, resolution: any) => any
  handlers: {
    [key: string]: any
  }
  handleIncomingMessage: (msg: any) => any
  eventsCount: number
}

const GnosisContext = createContext<GnosisContextReturnType>({
  sushiSwapIframeRef: null,
  hash: '',
  requests: [],
  resolveMany: () => {},
  handlers: {},
  handleIncomingMessage: () => {},
  eventsCount: 0
})

const isValidMessage = (msg: any) => {
  // if (!msg?.source?.parent) {
  //   return false
  // }
  const knownMethod = Object.values(Methods).includes(msg.method)

  return knownMethod
}

const STORAGE_KEY = 'gnosis_safe_state'

const GnosisProvider: React.FC = ({ children }) => {
  const sushiSwapIframeRef: any = useRef(null)
  const [hash, setHash] = useState('')
  const [eventsCount, setEventsCount] = useState(0)

  const verbose = 0
  const { network } = useNetwork()
  const { selectedAcc } = useAccounts()
  const { setRequests } = useRequests()

  const [stateStorage, setStateStorage] = useStorage({
    key: STORAGE_KEY,
    defaultValue: [],
    setInit: (initialRequests: any) => (!Array.isArray(initialRequests) ? [] : initialRequests)
  })

  useEffect(() => {
    const newHash = CONFIG.SWAP_URL + network?.chainId + selectedAcc
    setHash(newHash)
    setEventsCount(0)
  }, [network?.chainId, selectedAcc])

  const handlePersonalSign = useCallback(
    (msg: any) => {
      verbose > 0 && console.log('DApp requested signMessage', msg)

      const data = msg
      if (!data) {
        console.error('GS: no data')
        return
      }

      const id = `gs_${data.id}`
      const message = data?.params?.message
      if (!message) {
        console.error('GS: no message in received payload')
        return
      }

      const request = {
        id,
        dateAdded: new Date().valueOf(),
        forwardId: msg.id,
        type: 'personal_sign',
        txn: message,
        chainId: network.chainId,
        account: selectedAcc
      }
      // @ts-ignore
      setStateStorage((prevRequests: any) =>
        prevRequests.find((x: any) => x.id === request.id)
          ? prevRequests
          : [...prevRequests, request]
      )
      // @ts-ignore
      setRequests((prevRequests: any) =>
        prevRequests.find((x: any) => x.id === request.id)
          ? prevRequests
          : [...prevRequests, request]
      )
    },
    [network?.chainId, selectedAcc, setStateStorage, setRequests]
  )

  const handleSendTransactions = useCallback(
    (msg: any) => {
      verbose > 0 && console.log('DApp requested sendTx', msg)

      const data = msg
      if (!data) {
        console.error('GS: no data')
        return
      }

      const txs = data?.params?.txs
      if (txs?.length) {
        for (const i in txs) {
          if (!txs[i].from) txs[i].from = selectedAcc
        }
      } else {
        console.error('GS: no txs in received payload')
        return
      }

      for (const ix in txs) {
        const id = `gs_${data.id}:${ix}`
        const request = {
          id,
          dateAdded: new Date().valueOf(),
          forwardId: msg.id,
          type: 'eth_sendTransaction',
          isBatch: txs.length > 1,
          txn: txs[ix], // if anyone finds a dapp that sends a bundle, please reach me out
          chainId: network.chainId,
          account: selectedAcc
        }
        // is reducer really needed here?
        // @ts-ignore
        setStateStorage((prevRequests: any) =>
          prevRequests.find((x: any) => x.id === request.id)
            ? prevRequests
            : [...prevRequests, request]
        )
        // @ts-ignore
        setRequests((prevRequests: any) =>
          prevRequests.find((x: any) => x.id === request.id)
            ? prevRequests
            : [...prevRequests, request]
        )
      }
    },
    [network?.chainId, selectedAcc, setStateStorage, setRequests]
  )

  const handlers: any = useMemo(
    () => ({
      [Methods.getSafeInfo]: () => {
        return {
          safeAddress: selectedAcc,
          network: network.id,
          chainId: network.chainId,
          owners: [selectedAcc],
          threshold: 1
        }
      },
      [Methods.rpcCall]: async (msg: any) => {
        verbose > 0 && console.log('DApp requested rpcCall', msg)

        if (!msg?.params) {
          throw new Error('invalid call object')
        }

        const method = msg.params.call
        const callTx = msg.params.params

        const provider = getProvider(network.id)
        let result

        if (method === 'eth_call') {
          result = await provider.call(callTx[0], callTx[1]).catch((err: any) => {
            throw err
          })
        } else if (method === 'eth_getBalance') {
          result = await provider.getBalance(callTx[0], callTx[1]).catch((err: any) => {
            throw err
          })
        } else if (method === 'eth_blockNumber') {
          result = await provider.getBlockNumber().catch((err: any) => {
            throw err
          })
        } else if (method === 'eth_getBlockByNumber' || method === 'eth_getBlockByHash') {
          if (callTx[1]) {
            result = await provider.getBlockWithTransactions(callTx[0]).catch((err: any) => {
              throw err
            })
          } else {
            result = await provider.getBlock(callTx[0]).catch((err: any) => {
              throw err
            })
          }
        } else if (method === 'eth_getTransactionByHash') {
          result = await provider.getTransaction(callTx[0]).catch((err: any) => {
            throw err
          })
        } else if (method === 'eth_getCode') {
          result = await provider.getCode(callTx[0], callTx[1]).catch((err: any) => {
            throw err
          })
        } else if (method === 'eth_getBlockByNumber') {
          result = await provider.getBlock(callTx[0], callTx[1]).catch((err: any) => {
            throw err
          })
        } else if (method === 'eth_getTransactionReceipt') {
          result = await provider.getTransactionReceipt(callTx[0]).catch((err: any) => {
            throw err
          })
          // requires custom from calls from SDK but are not implemented in gnosis SDK
        } else if (method === 'gs_multi_send' || method === 'ambire_sendBatchTransaction') {
          // As future proof as possible (tested with a tweaked eth_call)
          msg.params.txs = callTx[0]
          await handleSendTransactions(msg).catch((err: any) => {
            throw err
          })
        } else if (method === 'personal_sign') {
          result = await handlePersonalSign(msg).catch((err: any) => {
            throw err
          })
        } else if (method === 'eth_estimateGas') {
          result = await provider.estimateGas(callTx).catch((err) => {
            throw err
          })
        } else {
          throw new Error(`method not supported ${method}`)
        }
        return result
      },
      [Methods.sendTransactions]: (msg: any) => {
        handleSendTransactions(msg)
      },
      [Methods.signMessage]: (msg: any) => handlePersonalSign(msg),
      [Methods.getTxBySafeTxHash]: async (msg: any) => {
        const { safeTxHash } = msg.params
        const provider = getProvider(network.id)
        try {
          const res = await provider.getTransaction(safeTxHash)

          return res
        } catch (e) {
          console.error(`GS: Err getting transaction ${safeTxHash}`)
          return {}
        }
      }
    }),
    [selectedAcc, network?.chainId, network?.id, handlePersonalSign, handleSendTransactions]
  )

  const send = useCallback((data: any, requestId: any, error?: any) => {
    const sdkVersion = getSDKVersion()
    const msg = error
      ? MessageFormatter.makeErrorResponse(requestId, error, sdkVersion)
      : MessageFormatter.makeResponse(requestId, data, sdkVersion)

    sushiSwapIframeRef?.current?.injectJavaScript(`
      (function() {
        document.getElementById("uniswap").contentWindow.postMessage(${JSON.stringify(msg)}, '*');
      })();

      true;
    `)
  }, [])

  const canHandleMessage = useCallback(
    (msg: any) => {
      return Boolean(handlers[msg.method])
    },
    [handlers]
  )

  const handleIncomingMessage = useCallback(
    async (msg: any) => {
      const validMessage = isValidMessage(msg)
      const hasHandler = canHandleMessage(msg)

      if (validMessage && hasHandler) {
        setEventsCount((prevEventsCount) => prevEventsCount + 1)
        const handler = handlers[msg.method]
        try {
          const response = await handler(msg)
          // If response is not returned, it means the response will be send somewhere else
          if (typeof response !== 'undefined') {
            send(response, msg.id)
          }
        } catch (err) {
          send(err.message, msg.id, true)
        }
      }
    },
    [canHandleMessage, handlers, send]
  )

  const resolveMany = useCallback(
    (ids: any, resolution: any) => {
      for (const req of stateStorage.filter((x: any) => ids.includes(x.id))) {
        if (!req.isBatch || req.id.endsWith(':0')) {
          const replyData: any = {
            id: req.forwardId,
            dateAdded: new Date().valueOf(),
            success: null,
            txId: null,
            error: null
          }
          if (!resolution) {
            replyData.error = 'Nothing to resolve'
            replyData.success = false
          } else if (!resolution.success) {
            replyData.error = resolution.message
            replyData.success = false
          } else {
            // onSuccess
            replyData.success = true
            replyData.txId = resolution.result
            replyData.safeTxHash = resolution.result
          }
          if (!sushiSwapIframeRef) {
            // soft error handling: sendTransaction has issues
            // throw new Error("gnosis safe connector not set")
            console.error('gnosis safe connector not set')
          } else {
            send(replyData, req.forwardId, replyData.error)
          }
        }
      }
      // @ts-ignore
      setStateStorage((prevRequests: any) => prevRequests.filter((x: any) => !ids.includes(x.id)))
      // @ts-ignore
      setRequests((prevRequests: any) => prevRequests.filter((x: any) => !ids.includes(x.id)))
    },
    [stateStorage, setStateStorage, send, setRequests]
  )

  return (
    <GnosisContext.Provider
      value={useMemo(
        () => ({
          sushiSwapIframeRef,
          handlers,
          hash,
          requests: stateStorage,
          resolveMany,
          handleIncomingMessage,
          eventsCount
        }),
        [handlers, stateStorage, hash, resolveMany, handleIncomingMessage, eventsCount]
      )}
    >
      {children}
    </GnosisContext.Provider>
  )
}

export { GnosisContext, GnosisProvider }
