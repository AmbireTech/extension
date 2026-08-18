import { describe, expect, test } from '@jest/globals'

import { getIsDelegationEnableDisabled } from './helpers'

describe('getIsDelegationEnableDisabled', () => {
  test('disables delegation when EIP-7702 is disabled', () => {
    expect(getIsDelegationEnableDisabled(false, null)).toBe(true)
  })

  test('allows delegation when EIP-7702 is enabled', () => {
    expect(getIsDelegationEnableDisabled(true, null)).toBe(false)
  })

  test('allows revoking an existing delegation when EIP-7702 is disabled', () => {
    expect(getIsDelegationEnableDisabled(false, '0x1111111111111111111111111111111111111111')).toBe(
      false
    )
  })
})
