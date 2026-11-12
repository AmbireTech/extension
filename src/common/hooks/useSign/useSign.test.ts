/**
 * @jest-environment jsdom
 */
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { ISignAccountOpController, SigningStatus } from '@ambire-common/interfaces/signAccountOp'

import useSign, { SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS } from './useSign'

// The same EOA imported as both a Ledger and a QR key, so both keys share its address
const mockLedgerKey = { addr: '0xeoa', type: 'ledger' }
const mockQrKey = { addr: '0xeoa', type: 'qr' }

const mockIsLedgerConnected = { value: false }

const buildSignAccountOpState = (
  overrides: Record<string, unknown> = {}
): ISignAccountOpController =>
  ({
    isInitialized: true,
    gasPrices: { slow: {}, medium: {}, fast: {}, ape: {} },
    status: { type: SigningStatus.ReadyToSign },
    readyToSign: true,
    isHumanizing: false,
    errors: [],
    warnings: [],
    banners: [],
    estimation: { error: null, estimationRetryError: null, status: 'success' },
    account: {},
    accountKeyStoreKeys: [mockLedgerKey, mockQrKey],
    feePayerKeyStoreKeys: [mockLedgerKey],
    threshold: 1,
    canChangeSigningKey: true,
    fromRequestId: 'req-1',
    accountOp: {
      id: 'op-1',
      signingKeyAddr: mockLedgerKey.addr,
      signingKeyType: 'ledger',
      gasFeePayment: {
        paidBy: mockLedgerKey.addr,
        paidByKeyType: 'ledger'
      }
    },
    ...overrides
  }) as unknown as ISignAccountOpController

const mockSignAccountOpState = { current: buildSignAccountOpState() }

const mockMainControllerDispatch = jest.fn()

const mockControllerDispatches: Record<string, jest.Mock> = {
  MainController: mockMainControllerDispatch,
  SignAccountOpController: jest.fn(),
  SwapAndBridgeController: jest.fn(),
  TransferController: jest.fn()
}

const mockHandleUpdate = jest.fn()
const mockHandleUpdateStatus = jest.fn()
const mockOnSafeSignComplete = jest.fn()

jest.mock('@common/hooks/useController', () => ({
  __esModule: true,
  default: (name: string) => {
    if (name === 'NetworksController') return { state: [] }
    if (name === 'AccountsController') return { state: { accountStates: {} } }

    const state = name === 'SignAccountOpController' ? mockSignAccountOpState.current : undefined

    return { state, dispatch: mockControllerDispatches[name] }
  }
}))

// Resolves to useLedger.web.ts via webpack's .web.ts extension rule, which jest
// cannot resolve — hence the virtual mock
jest.mock(
  '@common/modules/hardware-wallets/hooks/useLedger',
  () => ({
    __esModule: true,
    default: () => ({
      isLedgerConnected: mockIsLedgerConnected.value,
      requestLedgerDeviceAccess: jest.fn(),
      setIsLedgerConnected: jest.fn()
    })
  }),
  { virtual: true }
)

// Same as useLedger above - resolves to useOneKey.web.ts
jest.mock(
  '@common/modules/hardware-wallets/hooks/useOneKey',
  () => ({
    __esModule: true,
    default: () => ({ ensureOneKeyAccess: jest.fn().mockResolvedValue(true) })
  }),
  { virtual: true }
)

jest.mock('@common/hooks/useSigningAuth', () => ({
  __esModule: true,
  default: () => ({
    sheetRef: { current: null },
    requestSigningAuth: () => false,
    cancelSigningAuth: jest.fn(),
    signingAuthProps: {}
  })
}))

jest.mock('@common/modules/hardware-wallets/hooks/useQrSigningFlow', () => ({
  __esModule: true,
  default: () => ({
    currentRequest: null,
    signingStep: 'idle',
    moveToResponseScan: jest.fn(),
    moveBack: jest.fn(),
    submitSignatureResponse: jest.fn(),
    signingCleanup: jest.fn()
  })
}))

jest.mock('@common/hooks/useExtremeGasFeeWarning', () => ({
  __esModule: true,
  default: () => ({
    isActive: false,
    isProceedDelayed: false,
    remainingSeconds: 0,
    signButtonType: 'primary'
  })
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

jest.mock('react-native-modalize', () => ({
  useModalize: () => ({ ref: { current: null }, open: jest.fn(), close: jest.fn() })
}))

jest.mock('@web/modules/sign-account-op/utils/helpers', () => ({
  getIsSignLoading: (status?: ISignAccountOpController['status']) =>
    status?.type === SigningStatus.InProgress ||
    status?.type === SigningStatus.UpdatesPaused ||
    status?.type === SigningStatus.WaitingForPaymaster ||
    status?.type === SigningStatus.Done
}))

const mockHookResult = { current: null as ReturnType<typeof useSign> | null }
let root: ReturnType<typeof createRoot>

const Consumer = () => {
  // Capturing a hook result into an outer holder is the standard way to assert
  // on it; the compiler rule guarding production code doesn't apply here.
  // eslint-disable-next-line react-hooks/immutability
  mockHookResult.current = useSign({
    handleUpdateStatus: mockHandleUpdateStatus,
    handleUpdate: mockHandleUpdate,
    signAccountOpState: mockSignAccountOpState.current,
    hasReachedBottom: true,
    onSafeSignComplete: mockOnSafeSignComplete
  })

  return null
}

const mount = () => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

  root = createRoot(document.createElement('div'))

  act(() => {
    root.render(createElement(Consumer))
  })
}

// Re-renders with whatever mockSignAccountOpState.current holds now,
// the same way a controller update reaches the screen
const rerender = () => {
  act(() => {
    root.render(createElement(Consumer))
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockIsLedgerConnected.value = false
  mockSignAccountOpState.current = buildSignAccountOpState()
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
})

const broadcastDispatches = () =>
  mockMainControllerDispatch.mock.calls.filter(
    ([action]) => action?.params?.method === 'handleSignAndBroadcastAccountOp'
  )

const getHookResult = () => {
  if (!mockHookResult.current) throw new Error('useSign did not run')

  return mockHookResult.current
}

describe('useSign - signing flow selection after choosing a key', () => {
  it('opens the QR flow when a QR key is chosen while the stale state still names the Ledger key', () => {
    expect(mockSignAccountOpState.current.accountOp.signingKeyType).toBe('ledger')
    mount()

    act(() => {
      getHookResult().handleChangeSigningKey(mockQrKey.addr, 'qr')
    })

    expect(mockHandleUpdate).toHaveBeenCalledWith({
      signingKeyAddr: mockQrKey.addr,
      signingKeyType: 'qr'
    })
    expect(getHookResult().shouldDisplayLedgerConnectModal).toBe(false)
    expect(getHookResult().renderedButNotNecessarilyVisibleModal).not.toBe('ledger-connect')
    expect(getHookResult().renderedButNotNecessarilyVisibleModal).toBe('qr-sign')
  })

  it('still asks to connect the Ledger when a Ledger key is chosen and none is connected', () => {
    mockSignAccountOpState.current = buildSignAccountOpState({
      accountOp: {
        id: 'op-1',
        signingKeyAddr: mockQrKey.addr,
        signingKeyType: 'qr',
        gasFeePayment: { paidBy: mockQrKey.addr, paidByKeyType: 'qr' }
      }
    })
    mount()

    act(() => {
      getHookResult().handleChangeSigningKey(mockLedgerKey.addr, 'ledger')
    })

    expect(getHookResult().shouldDisplayLedgerConnectModal).toBe(true)
    expect(getHookResult().renderedButNotNecessarilyVisibleModal).toBe('ledger-connect')
    expect(broadcastDispatches()).toHaveLength(0)
  })

  it('does not open the QR flow when a Ledger key is chosen with the Ledger connected', () => {
    mockIsLedgerConnected.value = true
    mockSignAccountOpState.current = buildSignAccountOpState({
      accountOp: {
        id: 'op-1',
        signingKeyAddr: mockQrKey.addr,
        signingKeyType: 'qr',
        gasFeePayment: { paidBy: mockQrKey.addr, paidByKeyType: 'qr' }
      }
    })
    mount()

    act(() => {
      getHookResult().handleChangeSigningKey(mockLedgerKey.addr, 'ledger')
    })

    expect(getHookResult().renderedButNotNecessarilyVisibleModal).not.toBe('qr-sign')
    expect(getHookResult().shouldDisplayQrSigningModal).toBe(false)
    expect(broadcastDispatches()).toHaveLength(1)
  })

  it('still asks to connect the Ledger when the old Ledger signer keeps paying the fee', () => {
    // A smart account whose keys have different addresses - the fee stays with
    // the old signer, because only a payer that is the just-chosen key follows it
    const smartAccountLedgerKey = { addr: '0xsigner1', type: 'ledger' }
    const smartAccountQrKey = { addr: '0xsigner2', type: 'qr' }
    mockSignAccountOpState.current = buildSignAccountOpState({
      accountKeyStoreKeys: [smartAccountLedgerKey, smartAccountQrKey],
      feePayerKeyStoreKeys: [smartAccountLedgerKey],
      accountOp: {
        id: 'op-1',
        signingKeyAddr: smartAccountLedgerKey.addr,
        signingKeyType: 'ledger',
        gasFeePayment: { paidBy: smartAccountLedgerKey.addr, paidByKeyType: 'ledger' }
      }
    })
    mount()

    act(() => {
      getHookResult().handleChangeSigningKey(smartAccountQrKey.addr, 'qr')
    })

    expect(getHookResult().shouldDisplayLedgerConnectModal).toBe(true)
    expect(getHookResult().renderedButNotNecessarilyVisibleModal).toBe('ledger-connect')
    expect(broadcastDispatches()).toHaveLength(0)
  })

  it('follows the pending transaction signer when a speed up keeps it, even if another key is chosen', () => {
    // A speed up keeps the Ledger that signed the pending transaction, so it still has to be connected
    mockSignAccountOpState.current = buildSignAccountOpState({ canChangeSigningKey: false })
    mount()

    act(() => {
      getHookResult().handleChangeSigningKey(mockQrKey.addr, 'qr')
    })

    expect(getHookResult().shouldDisplayLedgerConnectModal).toBe(true)
    expect(getHookResult().renderedButNotNecessarilyVisibleModal).toBe('ledger-connect')
    expect(getHookResult().shouldDisplayQrSigningModal).toBe(false)
    expect(broadcastDispatches()).toHaveLength(0)
  })

  it('does not open the QR flow in a speed up signed by the connected Ledger when a QR key is chosen', () => {
    mockIsLedgerConnected.value = true
    mockSignAccountOpState.current = buildSignAccountOpState({ canChangeSigningKey: false })
    mount()

    act(() => {
      getHookResult().handleChangeSigningKey(mockQrKey.addr, 'qr')
    })

    expect(getHookResult().shouldDisplayQrSigningModal).toBe(false)
    expect(getHookResult().renderedButNotNecessarilyVisibleModal).not.toBe('qr-sign')
    expect(broadcastDispatches()).toHaveLength(1)
  })

  it('falls back to the controller state when no key was just chosen', () => {
    mockSignAccountOpState.current = buildSignAccountOpState({
      accountKeyStoreKeys: [mockQrKey],
      accountOp: {
        id: 'op-1',
        signingKeyAddr: mockQrKey.addr,
        signingKeyType: 'qr',
        gasFeePayment: { paidBy: mockQrKey.addr, paidByKeyType: 'qr' }
      }
    })
    mount()

    act(() => {
      getHookResult().onSignButtonClick()
    })

    expect(getHookResult().renderedButNotNecessarilyVisibleModal).toBe('qr-sign')
    expect(broadcastDispatches()).toHaveLength(1)
  })
})

describe('useSign - Safe "Sign & Close"', () => {
  // A 3 of 4 Safe with a single imported owner - signing with it still leaves the Safe
  // short of signatures, which is when "Sign & Close" is offered
  const safeOwnerKey = { addr: '0xowner', type: 'internal' }

  const buildSafeState = (accountOpOverrides: Record<string, unknown> = {}) =>
    buildSignAccountOpState({
      account: { safeCreation: {} },
      accountKeyStoreKeys: [safeOwnerKey],
      feePayerKeyStoreKeys: [],
      threshold: 3,
      safeSmartAccountOwners: [],
      pendingSafeOwnerApprovals: [],
      canBroadcast: false,
      status: { type: SigningStatus.ReadyToSign },
      accountOp: {
        id: 'op-1',
        signingKeyAddr: safeOwnerKey.addr,
        signingKeyType: safeOwnerKey.type,
        signed: [],
        ...accountOpOverrides
      }
    })

  const signAndClose = () => {
    act(() => {
      getHookResult().handleChangeSigningKeyAndClose(safeOwnerKey.addr, 'internal')
    })
  }

  const completeSigning = (signed: string[] = [safeOwnerKey.addr], id = 'op-1') => {
    mockSignAccountOpState.current = {
      ...buildSafeState({ id, signed }),
      status: { type: SigningStatus.Queued }
    } as ISignAccountOpController
    rerender()
  }

  const advanceTimers = (ms: number) => {
    act(() => {
      jest.advanceTimersByTime(ms)
    })
  }

  beforeEach(() => {
    jest.useFakeTimers()
    mockSignAccountOpState.current = buildSafeState()
  })

  afterEach(() => {
    // Unmounted while the fake timers are still on, so the hook's own cleanup clears its
    // timers. The outer afterEach unmounting again is a no-op
    act(() => {
      root.unmount()
    })
    jest.useRealTimers()
  })

  it('shows that the signature was added, then closes on its own once', () => {
    mount()
    signAndClose()
    completeSigning()

    expect(getHookResult().safeSignatureAdded).toEqual({
      accountOpId: 'op-1',
      signedCount: 1,
      threshold: 3,
      closesAt: Date.now() + SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS
    })
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()

    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS - 1)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()

    advanceTimers(1)
    expect(mockOnSafeSignComplete).toHaveBeenCalledTimes(1)

    // More controller updates after closing must not close it again
    rerender()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).toHaveBeenCalledTimes(1)
  })

  it('keeps the signature count and the close time from the moment of signing when other owners sign afterwards', () => {
    mount()
    signAndClose()
    completeSigning()

    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS / 2)
    completeSigning([safeOwnerKey.addr, '0xanotherOwner'])

    expect(getHookResult().safeSignatureAdded?.signedCount).toBe(1)

    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS / 2)
    expect(mockOnSafeSignComplete).toHaveBeenCalledTimes(1)
  })

  it('leaves the request open when another owner signed meanwhile and it can already go through', () => {
    mount()
    signAndClose()
    completeSigning([safeOwnerKey.addr, '0xanotherOwner', '0xthirdOwner'])

    expect(getHookResult().safeSignatureAdded).toBeNull()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })

  it('does not show the success state before the own signature is added', () => {
    mount()
    signAndClose()
    completeSigning(['0xanotherOwner'])

    expect(getHookResult().safeSignatureAdded).toBeNull()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })

  it('does not show the success state after a regular sign, without "Sign & Close"', () => {
    mount()
    act(() => {
      getHookResult().handleChangeSigningKey(safeOwnerKey.addr, 'internal')
    })
    completeSigning()

    expect(getHookResult().safeSignatureAdded).toBeNull()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })

  it('does not close when the screen is left before the success state ends', () => {
    mount()
    signAndClose()
    completeSigning()

    act(() => {
      root.render(null)
    })
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)

    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })

  it('drops the success state and does not close when another request takes over', () => {
    mount()
    signAndClose()
    completeSigning()

    mockSignAccountOpState.current = buildSafeState({ id: 'op-2' })
    rerender()

    expect(getHookResult().safeSignatureAdded).toBeNull()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })

  it('leaves the request open when the signature could not be shared with the other owners', () => {
    mount()
    signAndClose()
    mockSignAccountOpState.current = {
      ...buildSafeState({ signed: [safeOwnerKey.addr] }),
      status: { type: SigningStatus.Queued },
      hasSafeApiFailed: true
    } as ISignAccountOpController
    rerender()

    expect(getHookResult().safeSignatureAdded).toBeNull()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })

  it('closes right away, without the success state, when how many signatures are needed is unknown', () => {
    mount()
    signAndClose()
    mockSignAccountOpState.current = {
      ...buildSafeState({ signed: [safeOwnerKey.addr] }),
      status: { type: SigningStatus.Queued },
      threshold: 0
    } as ISignAccountOpController
    rerender()

    expect(getHookResult().safeSignatureAdded).toBeNull()
    expect(mockOnSafeSignComplete).toHaveBeenCalledTimes(1)
  })

  it('does not close after a plain sign that follows a "Sign & Close" which never finished', () => {
    mount()
    // e.g. the password prompt was cancelled, so the signature was never added
    signAndClose()
    act(() => {
      getHookResult().handleChangeSigningKey(safeOwnerKey.addr, 'internal')
    })
    completeSigning()

    expect(getHookResult().safeSignatureAdded).toBeNull()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })

  it('does not show the success state again when the window goes back to the request it was added to', () => {
    mount()
    signAndClose()
    completeSigning()

    mockSignAccountOpState.current = buildSafeState({ id: 'op-2' })
    rerender()
    // op-1 still waits for the other owners, so it is still Queued with this owner's signature
    completeSigning([safeOwnerKey.addr], 'op-1')

    expect(getHookResult().safeSignatureAdded).toBeNull()
    advanceTimers(SAFE_SIGN_AND_CLOSE_SUCCESS_DURATION_MS)
    expect(mockOnSafeSignComplete).not.toHaveBeenCalled()
  })
})
