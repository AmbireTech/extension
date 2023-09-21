/* eslint-disable @typescript-eslint/no-shadow */
import { networks } from 'ambire-common/src/consts/networks'
import EventEmitter from 'ambire-common/src/controllers/eventEmitter'
import { MainController } from 'ambire-common/src/controllers/main/main'
import { Account } from 'ambire-common/src/interfaces/account'
import { UserRequest } from 'ambire-common/src/interfaces/userRequest'
import { ethErrors } from 'eth-rpc-errors'

import { isDev } from '@common/config/env'
import { IS_CHROME, IS_LINUX } from '@web/constants/common'
import userNotification from '@web/extension-services/background/libs/user-notification'
import winMgr, { WINDOW_SIZE } from '@web/extension-services/background/webapi/window'

const QUEUE_REQUESTS_COMPONENTS_WHITELIST = [
  'SendTransaction',
  'SignText',
  'SignTypedData',
  'LedgerHardwareWaiting'
]

export const SIGN_METHODS = [
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'personal_sign',
  'eth_sign',
  'eth_sendTransaction',
  'gs_multi_send',
  'ambire_sendBatchTransaction'
]

export const isSignAccountOpMethod = (method: string) => {
  return ['eth_sendTransaction', 'gs_multi_send', 'ambire_sendBatchTransaction'].includes(method)
}

export const isSignTypedDataMethod = (method: string) => {
  return [
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4'
  ].includes(method)
}

export const isSignMessageMethod = (method: string) => {
  return ['personal_sign', 'eth_sign'].includes(method)
}

export interface NotificationRequest {
  id: number
  screen: string
  winProps?: any
  params?: any
  accountAddr?: string
  networkId?: string
  resolve: (data: any) => void
  reject: (data: any) => void
}

export class NotificationController extends EventEmitter {
  #mainCtrl: MainController

  _notificationRequests: NotificationRequest[] = []

  notificationWindowId: null | number = null

  currentNotificationRequest: NotificationRequest | null = null

  get notificationRequests() {
    return this._notificationRequests
  }

  set notificationRequests(newValue: NotificationRequest[]) {
    this._notificationRequests = newValue
  }

  constructor(mainCtrl: MainController) {
    super()
    this.#mainCtrl = mainCtrl
    winMgr.event.on('windowRemoved', (winId: number) => {
      if (winId === this.notificationWindowId) {
        this.notificationWindowId = null
        this.rejectAllNotificationRequestsThatAreNotSignRequests()
      }
    })

    this.#mainCtrl.onUpdate(() => {
      const notificationRequestsToAdd: NotificationRequest[] = []
      this.#mainCtrl.userRequests.forEach((userReq: UserRequest) => {
        const notificationReq = this.notificationRequests.find((req) => req.id === userReq.id)
        if (!notificationReq) {
          const getScreenType = (kind: UserRequest['action']['kind']) => {
            if (kind === 'call') return 'SendTransaction'
            if (kind === 'message') return 'SignText'
            if (kind === 'typedMessage') return 'SignTypedData'
            return undefined
          }

          const notificationRequestFromUserRequest: NotificationRequest = {
            id: userReq.id,
            screen: getScreenType(userReq.action.kind) as string,
            params: {
              method: 'eth_sendTransaction'
            },
            accountAddr: userReq.accountAddr,
            networkId: userReq.networkId,
            resolve: () => {},
            reject: () => {}
          }
          notificationRequestsToAdd.push(notificationRequestFromUserRequest)
        }
      })
      if (notificationRequestsToAdd.length) {
        this.notificationRequests = [...notificationRequestsToAdd, ...this.notificationRequests]
        this.openNotificationRequest(this.notificationRequests[0].id)
      }
    })

    winMgr.event.on('windowFocusChange', (winId: number) => {
      // Otherwise, inspecting the notification popup (opening console) is
      // triggering the logic and firing `this.rejectNotificationRequest()` call,
      // which is closing the notification popup, and one can't inspect it.
      if (isDev) return

      if (IS_CHROME && winId === chrome.windows.WINDOW_ID_NONE && IS_LINUX) {
        // When sign on Linux, will focus on -1 first then focus on sign window
        return
      }

      if (this.notificationWindowId !== null && winId !== this.notificationWindowId) {
        if (
          this.currentNotificationRequest &&
          !QUEUE_REQUESTS_COMPONENTS_WHITELIST.includes(this.currentNotificationRequest.screen)
        ) {
          this.rejectNotificationRequest()
        }
      }
    })
  }

  reopenCurrentNotificationRequest = async () => {
    try {
      if (this.notificationRequests.length < 0 || !this.currentNotificationRequest) return
      this.openNotification(this.currentNotificationRequest?.winProps)
    } catch (e: any) {
      this.emitError({
        level: 'major',
        message: 'Request opening failed',
        error: e
      })
    }
  }

  openNotificationRequest = async (notificationId: number) => {
    try {
      const notificationRequest = this.notificationRequests.find((req) => req.id === notificationId)
      if (notificationRequest && !SIGN_METHODS.includes(notificationRequest?.params?.method)) {
        const windows = await browser.windows.getAll()
        const existWindow = windows.find((window) => window.id === this.notificationWindowId)
        if (this.notificationWindowId !== null && !!existWindow) {
          const {
            top: cTop,
            left: cLeft,
            width
          } = await browser.windows.getCurrent({
            windowTypes: ['normal']
          })

          const top = cTop
          const left = cLeft! + width! - WINDOW_SIZE.width
          browser.windows.update(this.notificationWindowId, {
            focused: true,
            top,
            left
          })
          return
        }
      }

      if (this.notificationRequests.length < 0) return

      if (notificationRequest) {
        this.currentNotificationRequest = notificationRequest
        this.emitUpdate()
        this.openNotification(notificationRequest.winProps)
      }
    } catch (e: any) {
      this.emitError({
        level: 'major',
        message: 'Request opening failed',
        error: e
      })
    }
  }

  deleteNotificationRequest = (request: NotificationRequest) => {
    if (request && this.notificationRequests.length) {
      this.notificationRequests = this.notificationRequests.filter((item) => request.id !== item.id)
    } else {
      this.currentNotificationRequest = null
    }
  }

  resolveNotificationRequest = async (data: any, requestId?: number) => {
    let notificationRequest = this.currentNotificationRequest

    if (requestId) {
      const notificationRequestById = this.notificationRequests.find((req) => req.id === requestId)
      if (notificationRequestById) notificationRequest = notificationRequestById
    }

    if (notificationRequest) {
      notificationRequest?.resolve(data)

      if (SIGN_METHODS.includes(notificationRequest.params?.method)) {
        this.#mainCtrl.removeUserRequest(notificationRequest?.id)
        this.deleteNotificationRequest(notificationRequest)
        this.currentNotificationRequest = null
      } else {
        const currentOrigin = notificationRequest.params?.session?.origin
        this.deleteNotificationRequest(notificationRequest)
        const nextNotificationRequest = this.notificationRequests[0]
        const nextOrigin = nextNotificationRequest?.params?.session?.origin

        const shouldOpenNextRequest =
          (nextNotificationRequest &&
            !SIGN_METHODS.includes(nextNotificationRequest?.params?.method)) ||
          (nextNotificationRequest && currentOrigin && nextOrigin && currentOrigin === nextOrigin)

        if (shouldOpenNextRequest) {
          this.currentNotificationRequest = nextNotificationRequest
        } else this.currentNotificationRequest = null
      }
    }
    this.emitUpdate()
  }

  // eslint-disable-next-line default-param-last
  rejectNotificationRequest = async (err: string = 'Request rejected', requestId?: number) => {
    let notificationRequest = this.currentNotificationRequest

    if (requestId) {
      const notificationRequestById = this.notificationRequests.find((req) => req.id === requestId)
      if (notificationRequestById) notificationRequest = notificationRequestById
    }

    if (notificationRequest) {
      notificationRequest?.reject &&
        notificationRequest?.reject(ethErrors.provider.userRejectedRequest<any>(err))

      if (SIGN_METHODS.includes(notificationRequest.params?.method)) {
        this.#mainCtrl.removeUserRequest(notificationRequest?.id)
        this.deleteNotificationRequest(notificationRequest)

        let nextNotificationUserRequest = null
        if (isSignAccountOpMethod(notificationRequest?.params?.method)) {
          const account =
            this.#mainCtrl.accounts.find((a) => a.addr === this.#mainCtrl.selectedAccount) ||
            ({} as Account)
          if (account.creation) {
            nextNotificationUserRequest =
              this.notificationRequests.find(
                (req) =>
                  req.accountAddr === notificationRequest?.accountAddr &&
                  req.networkId === notificationRequest?.networkId
              ) || null
          }
        }
        this.currentNotificationRequest = nextNotificationUserRequest
      } else {
        this.deleteNotificationRequest(notificationRequest)
        const nextNotificationRequest = this.notificationRequests[0]
        if (
          nextNotificationRequest &&
          !SIGN_METHODS.includes(nextNotificationRequest?.params?.method)
        ) {
          this.currentNotificationRequest = nextNotificationRequest
        } else this.currentNotificationRequest = null
      }
    }

    this.emitUpdate()
  }

  requestNotificationRequest = async (data: any, winProps?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const id = new Date().getTime()
      const notificationRequest: NotificationRequest = {
        id,
        winProps,
        params: data?.params,
        screen: data.screen,
        resolve: (data) => {
          resolve(data)
        },
        reject: (data) => {
          reject(data)
        }
      }

      if (!QUEUE_REQUESTS_COMPONENTS_WHITELIST.includes(data.screen) && this.notificationWindowId) {
        if (this.currentNotificationRequest) {
          throw ethErrors.provider.userRejectedRequest(
            'please request after current request resolve'
          )
        }
      }

      // If account op we add the notification request when we validate the txn params
      if (!isSignAccountOpMethod(notificationRequest.params?.method)) {
        this.notificationRequests = [notificationRequest, ...this.notificationRequests]
      }
      this.currentNotificationRequest = notificationRequest

      if (
        ['wallet_switchEthereumChain', 'wallet_addEthereumChain'].includes(data?.params?.method)
      ) {
        let chainId = data.params?.data?.[0]?.chainId
        if (typeof chainId === 'string') {
          chainId = Number(chainId)
        }

        const network = networks.find((n) => Number(n.chainId) === chainId)
        if (network) {
          this.resolveNotificationRequest(null, notificationRequest.id)
          return
        }
      }
      if (isSignMessageMethod(data?.params?.method)) {
        const request = userNotification.createSignMessageUserRequest({
          id,
          data: data?.params?.data,
          origin: data.params?.session?.origin,
          selectedAccount: this.#mainCtrl.selectedAccount || '',
          onError: (err) => this.rejectNotificationRequest(err),
          onSuccess: (data, id) => this.resolveNotificationRequest(data, id)
        })
        if (request) this.#mainCtrl.addUserRequest(request)
        else {
          this.rejectNotificationRequest('Invalid request data')
          return
        }
      }

      if (isSignTypedDataMethod(data?.params?.method)) {
        const request = userNotification.createSignTypedDataUserRequest({
          id,
          data: data?.params?.data,
          origin: data.params?.session?.origin,
          selectedAccount: this.#mainCtrl.selectedAccount || '',
          onError: (err) => this.rejectNotificationRequest(err),
          onSuccess: (data, id) => this.resolveNotificationRequest(data, id)
        })
        if (request) this.#mainCtrl.addUserRequest(request)
        else {
          this.rejectNotificationRequest('Invalid request data')
          return
        }
      }

      if (isSignAccountOpMethod(data?.params?.method)) {
        const txs = data?.params?.data

        Object.keys(txs).forEach((key) => {
          const request = userNotification.createAccountOpUserRequest({
            id,
            txn: txs[key],
            txs,
            origin: data.params?.session?.origin,
            selectedAccount: this.#mainCtrl.selectedAccount || '',
            onError: (err) => this.rejectNotificationRequest(err),
            onSuccess: (data, id) => this.resolveNotificationRequest(data, id)
          })
          if (request) {
            const accountOpNotificationRequest = {
              ...notificationRequest,
              accountAddr: request.accountAddr,
              networkId: request.networkId
            }
            this.notificationRequests = [accountOpNotificationRequest, ...this.notificationRequests]
            this.currentNotificationRequest = accountOpNotificationRequest
            this.#mainCtrl.addUserRequest(request)
          } else {
            this.notificationRequests = [notificationRequest, ...this.notificationRequests]
            this.rejectNotificationRequest('Invalid request data')
          }
        })
      }
      this.emitUpdate()
      this.openNotification(notificationRequest.winProps)
    })
  }

  clear = async () => {
    this.notificationRequests = []
    this.currentNotificationRequest = null
    if (this.notificationWindowId !== null) {
      try {
        await winMgr.remove(this.notificationWindowId)
      } catch (e) {
        // ignore error
      }
      this.notificationWindowId = null
    }
    this.emitUpdate()
  }

  rejectAllNotificationRequestsThatAreNotSignRequests = () => {
    this.notificationRequests.forEach((notificationReq) => {
      if (!SIGN_METHODS.includes(notificationReq?.params?.method)) {
        this.rejectNotificationRequest(
          `User rejected the request: ${notificationReq?.params?.method}`,
          notificationReq.id
        )
      }
    })
    this.emitUpdate()
  }

  openNotification = (winProps: any) => {
    if (this.notificationWindowId !== null) {
      winMgr.remove(this.notificationWindowId)
      this.notificationWindowId = null
      this.emitUpdate()
    }
    winMgr.openNotification(winProps).then((winId) => {
      this.notificationWindowId = winId!
      this.emitUpdate()
    })
  }

  toJSON() {
    return {
      ...this,
      notificationRequests: this.notificationRequests // includes the getter in the stringified instance
    }
  }
}
