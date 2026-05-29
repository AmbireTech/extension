import { PRIVATE_KEY, SEED } from 'constants/env'
import { test } from 'fixtures/pageObjects'

import { expect } from '@playwright/test'

import { findSecretInRequests } from '../../utils/secretLeakDetector'

test.describe('security: private key leak prevention', { tag: '@security' }, () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithoutStorage()
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('private key should not appear in any network request', async ({ pages }) => {
    await test.step('start monitoring requests', async () => {
      await pages.auth.monitorRequests()
    })

    await test.step('import account via private key', async () => {
      await pages.auth.importExistingAccount()
    })

    await test.step('wait for post-import network activity to settle', async () => {
      await pages.auth.page.waitForTimeout(5000)
    })

    await test.step('assert no requests were made to unknown domains', async () => {
      const { uncategorized } = pages.auth.getCategorizedRequests()
      expect(
        uncategorized,
        `Requests to unknown domains detected:\n${uncategorized.join('\n')}`
      ).toHaveLength(0)
    })

    await test.step('assert private key did not appear in any request', async () => {
      const requests = pages.auth.getRequestsWithBodies()
      const leakingRequests = findSecretInRequests(requests, PRIVATE_KEY)

      expect(
        leakingRequests,
        `Private key detected in the following requests:\n${leakingRequests.join('\n')}`
      ).toHaveLength(0)
    })
  })

  test('seed phrase should not appear in any network request', async ({ pages }) => {
    await test.step('start monitoring requests', async () => {
      await pages.auth.monitorRequests()
    })

    await test.step('import account via seed phrase', async () => {
      await pages.auth.importExistingAccountByRecoveryPhrase(SEED)
    })

    await test.step('wait for post-import network activity to settle', async () => {
      await pages.auth.page.waitForTimeout(5000)
    })

    await test.step('assert no requests were made to unknown domains', async () => {
      const { uncategorized } = pages.auth.getCategorizedRequests()
      expect(
        uncategorized,
        `Requests to unknown domains detected:\n${uncategorized.join('\n')}`
      ).toHaveLength(0)
    })

    await test.step('assert seed phrase did not appear in any request', async () => {
      const requests = pages.auth.getRequestsWithBodies()
      const leakingRequests = findSecretInRequests(requests, SEED)

      expect(
        leakingRequests,
        `Seed phrase detected in the following requests:\n${leakingRequests.join('\n')}`
      ).toHaveLength(0)
    })
  })
})
