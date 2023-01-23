import { ethErrors } from 'eth-rpc-errors'
import { EthereumProviderError } from 'eth-rpc-errors/dist/classes'
import Events from 'events'

import preferenceService from '@web/background/services/permission'
import winMgr from '@web/background/webapi/window'
import { IS_CHROME, IS_LINUX } from '@web/constants/common'

export interface Approval {
  id: string
  taskId: number | null
  signingTxId?: string
  data: {
    params?: import('react').ComponentProps<any>['params']
    origin?: string
    approvalComponent: any
    requestDefer?: Promise<any>
    approvalType?: string
  }
  winProps: any
  resolve?(params?: any): void
  reject?(err: EthereumProviderError<any>): void
}

const QUEUE_APPROVAL_COMPONENTS_WHITELIST = [
  'SignTx',
  'SignText',
  'SignTypedData',
  'LedgerHardwareWaiting',
  'QRHardWareWaiting',
  'WatchAdrressWaiting'
]

// something need user approval in window
// should only open one window, unfocus will close the current notification
class NotificationService extends Events {
  currentApproval: Approval | null = null

  _approvals: Approval[] = []

  notifiWindowId: null | number = null

  isLocked = false

  get approvals() {
    return this._approvals
  }

  set approvals(val: Approval[]) {
    this._approvals = val
    if (val.length <= 0) {
      browser.browserAction.setBadgeText({
        text: null
      })
    } else {
      browser.browserAction.setBadgeText({
        text: `${val.length}`
      })
      browser.browserAction.setBadgeBackgroundColor({
        color: '#FE815F'
      })
    }
  }

  constructor() {
    super()

    winMgr.event.on('windowRemoved', (winId: number) => {
      if (winId === this.notifiWindowId) {
        this.notifiWindowId = null
        this.rejectAllApprovals()
      }
    })

    winMgr.event.on('windowFocusChange', (winId: number) => {
      if (IS_CHROME && winId === chrome.windows.WINDOW_ID_NONE && IS_LINUX) {
        // When sign on Linux, will focus on -1 first then focus on sign window
        return
      }

      if (this.notifiWindowId !== null && winId !== this.notifiWindowId) {
        if (
          this.currentApproval &&
          !QUEUE_APPROVAL_COMPONENTS_WHITELIST.includes(this.currentApproval.data.approvalComponent)
        ) {
          this.rejectApproval()
        }
      }
    })
  }

  activeFirstApproval = async () => {
    try {
      const windows = await browser.windows.getAll()
      const existWindow = windows.find((window) => window.id === this.notifiWindowId)
      if (this.notifiWindowId !== null && !!existWindow) {
        browser.windows.update(this.notifiWindowId, {
          focused: true
        })
        return
      }

      if (this.approvals.length < 0) return

      const approval = this.approvals[0]
      this.currentApproval = approval
      this.openNotification(approval.winProps, true)
    } catch (e) {
      // TODO:
      // Sentry.captureException(`activeFirstApproval failed: ${JSON.stringify(e)}`)
      this.clear()
    }
  }

  deleteApproval = (approval) => {
    if (approval && this.approvals.length > 1) {
      this.approvals = this.approvals.filter((item) => approval.id !== item.id)
    } else {
      this.currentApproval = null
      this.approvals = []
    }
  }

  getApproval = () => this.currentApproval

  resolveApproval = async (data?: any, forceReject = false, approvalId?: string) => {
    if (approvalId && approvalId !== this.currentApproval?.id) return
    if (forceReject) {
      this.currentApproval?.reject &&
        this.currentApproval?.reject(new EthereumProviderError(4001, 'User Cancel'))
    } else {
      this.currentApproval?.resolve && this.currentApproval?.resolve(data)
    }

    const approval = this.currentApproval

    this.deleteApproval(approval)

    if (this.approvals.length > 0) {
      this.currentApproval = this.approvals[0]
    } else {
      this.currentApproval = null
    }

    this.emit('resolve', data)
  }

  rejectApproval = async (err?: string, stay = false, isInternal = false) => {
    const approval = this.currentApproval

    if (this.approvals.length <= 1) {
      await this.clear(stay) // TODO: FIXME
    }

    if (isInternal) {
      approval?.reject && approval?.reject(ethErrors.rpc.internal(err))
    } else {
      approval?.reject && approval?.reject(ethErrors.provider.userRejectedRequest<any>(err))
    }
    // TODO: remove
    // if (approval?.signingTxId) {
    //   transactionHistoryService.removeSigningTx(approval.signingTxId)
    // }

    if (approval && this.approvals.length > 1) {
      this.deleteApproval(approval)
      this.currentApproval = this.approvals[0]
    } else {
      await this.clear(stay)
    }
    this.emit('reject', err)
  }

  requestApproval = async (data, winProps?): Promise<any> => {
    // const currentAccount = preferenceService.getCurrentAccount()
    const reportExplain = (signingTxId?: string) => {
      // const explain = transactionHistoryService.getExplainCacheByApprovalId(
      //   approvalId
      // );
      // const signingTx = signingTxId ? transactionHistoryService.getSigningTx(signingTxId) : null
      // const explain = signingTx?.explain
      const explain = false

      // if (explain && currentAccount) {
      // stats.report('preExecTransaction', {
      //   type: currentAccount.brandName,
      //   category: KEYRING_CATEGORY_MAP[currentAccount.type],
      //   chainId: explain.native_token.chain,
      //   success: explain.calcSuccess && explain.pre_exec.success,
      //   createBy: data?.params.$ctx?.ga ? 'rabby' : 'dapp',
      //   source: data?.params.$ctx?.ga?.source || '',
      //   trigger: data?.params.$ctx?.ga.trigger || ''
      // })
      // }
    }
    return new Promise((resolve, reject) => {
      // const uuid = uuidv4()
      let signingTxId
      // if (data.approvalComponent === 'SignTx') {
      //   signingTxId = transactionHistoryService.addSigningTx(data.params.data[0])
      // }

      const approval: Approval = {
        // taskId: uuid,
        // id: uuid,
        signingTxId,
        data,
        winProps,
        resolve(data) {
          if (this.data.approvalComponent === 'SignTx') {
            reportExplain(this.signingTxId)
          }
          resolve(data)
        },
        reject(data) {
          if (this.data.approvalComponent === 'SignTx') {
            reportExplain(this.signingTxId)
          }
          reject(data)
        }
      }

      if (!QUEUE_APPROVAL_COMPONENTS_WHITELIST.includes(data.approvalComponent)) {
        if (this.currentApproval) {
          throw ethErrors.provider.userRejectedRequest(
            'please request after current approval resolve'
          )
        }
      } else if (
        this.currentApproval &&
        !QUEUE_APPROVAL_COMPONENTS_WHITELIST.includes(this.currentApproval.data.approvalComponent)
      ) {
        throw ethErrors.provider.userRejectedRequest(
          'please request after current approval resolve'
        )
      }

      if (data.isUnshift) {
        this.approvals = [approval, ...this.approvals]
        this.currentApproval = approval
      } else {
        this.approvals = [...this.approvals, approval]
        if (!this.currentApproval) {
          this.currentApproval = approval
        }
      }
      if (
        ['wallet_switchEthereumChain', 'wallet_addEthereumChain'].includes(data?.params?.method)
      ) {
        const chainId = data.params?.data?.[0]?.chainId
        // TODO:
        // const chain = Object.values(CHAINS).find((chain) =>
        //   new BigNumber(chain.hex).isEqualTo(chainId)
        // )

        const chain = null
        if (chain) {
          this.resolveApproval(null)
          return
        }
      }

      if (this.notifiWindowId !== null) {
        browser.windows.update(this.notifiWindowId, {
          focused: true
        })
      } else {
        this.openNotification(approval.winProps)
      }
    })
  }

  clear = async (stay = false) => {
    this.approvals = []
    this.currentApproval = null
    if (this.notifiWindowId !== null && !stay) {
      try {
        await winMgr.remove(this.notifiWindowId)
      } catch (e) {
        // ignore error
      }
      this.notifiWindowId = null
    }
  }

  rejectAllApprovals = () => {
    this.approvals.forEach((approval) => {
      approval.reject &&
        approval.reject(new EthereumProviderError(4001, 'User rejected the request.'))
    })
    this.approvals = []
    this.currentApproval = null
    // TODO:
    // transactionHistoryService.removeAllSigningTx()
  }

  unLock = () => {
    this.isLocked = false
  }

  lock = () => {
    this.isLocked = true
  }

  openNotification = (winProps, ignoreLock = false) => {
    // Only use ignoreLock flag when approval exist but no notification window exist
    if (!ignoreLock) {
      if (this.isLocked) return
      this.lock()
    }
    if (this.notifiWindowId !== null) {
      winMgr.remove(this.notifiWindowId)
      this.notifiWindowId = null
    }
    winMgr.openNotification(winProps).then((winId) => {
      this.notifiWindowId = winId!
    })
  }
}

export default new NotificationService()
