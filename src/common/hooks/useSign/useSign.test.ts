/**
 * @jest-environment jsdom
 */
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { ISignAccountOpController, SigningStatus } from '@ambire-common/interfaces/signAccountOp'

import useSign from './useSign'

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
    hasReachedBottom: true
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
