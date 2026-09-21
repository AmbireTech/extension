import { StepsData } from '@benzin/screens/BenzinScreen/hooks/useSteps'

import { hasBalanceChangesSettled } from './rows'

const STEPS_STATE: StepsData = {
  blockData: null,
  finalizedStatus: null,
  feePaidWith: null,
  hasBalanceChangesFailed: false,
  calls: null,
  txnId: null,
  from: null,
  originatedFrom: null,
  userOp: null
}

describe('hasBalanceChangesSettled', () => {
  it('keeps the spinner up while the balances are still being read', () => {
    expect(hasBalanceChangesSettled(STEPS_STATE)).toBe(false)
  })

  it('settles once the balance changes arrive', () => {
    expect(hasBalanceChangesSettled({ ...STEPS_STATE, balanceChanges: [] })).toBe(true)
  })

  it('settles once reading them failed, so a bad RPC does not spin forever', () => {
    expect(hasBalanceChangesSettled({ ...STEPS_STATE, hasBalanceChangesFailed: true })).toBe(true)
  })

  it('settles on the balance changes of an account op the extension already submitted', () => {
    const stepsState = {
      ...STEPS_STATE,
      submittedAccountOp: { balanceChanges: [] }
    } as unknown as StepsData

    expect(hasBalanceChangesSettled(stepsState)).toBe(true)
  })

  it('keeps the spinner up when the submitted account op carries no balance changes yet', () => {
    const stepsState = { ...STEPS_STATE, submittedAccountOp: {} } as unknown as StepsData

    expect(hasBalanceChangesSettled(stepsState)).toBe(false)
  })
})
