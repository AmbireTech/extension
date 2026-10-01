import { test as base } from '@mobilewright/test'

import { PageManager } from '../pages/index'

type PageFixtures = {
  pages: PageManager
}

export const test = base.extend<PageFixtures>({
  pages: async ({ device }, use) => {
    const pageManager = new PageManager(device)

    await use(pageManager)
  }
})

export { expect } from '@mobilewright/test'
