import { getIsSimulationOutdated, isAccountOpSimulationCurrent } from './helpers'

describe('isAccountOpSimulationCurrent', () => {
  test('accepts a simulation for the current AccountOp', () => {
    expect(isAccountOpSimulationCurrent('current-op', 'current-op')).toBe(true)
  })

  test('rejects a simulation from another AccountOp even when both have the same call count', () => {
    expect(isAccountOpSimulationCurrent('rejection-op', 'original-safe-op')).toBe(false)
  })

  test('rejects a missing current or simulated AccountOp', () => {
    expect(isAccountOpSimulationCurrent(undefined, 'simulated-op')).toBe(false)
    expect(isAccountOpSimulationCurrent('current-op')).toBe(false)
  })
})

describe('getIsSimulationOutdated', () => {
  test('marks a late simulation from the original request as outdated', () => {
    expect(
      getIsSimulationOutdated({
        currentAccountOpId: 'rejection-op',
        simulatedAccountOpId: 'original-safe-op',
        hasInitialSimulationLoaded: true,
        hasSimulationError: false
      })
    ).toBe(true)
  })

  test('accepts the rejection request simulation when it arrives', () => {
    expect(
      getIsSimulationOutdated({
        currentAccountOpId: 'rejection-op',
        simulatedAccountOpId: 'rejection-op',
        hasInitialSimulationLoaded: true,
        hasSimulationError: false
      })
    ).toBe(false)
  })

  test('allows an error without an attached AccountOp to be displayed', () => {
    expect(
      getIsSimulationOutdated({
        currentAccountOpId: 'rejection-op',
        hasInitialSimulationLoaded: true,
        hasSimulationError: true
      })
    ).toBe(false)
  })
})
