import type { PageManager } from '../pages/utils/page_instances'

export async function runAddManualNetworkFlow({ pages }: { pages: PageManager }) {
  await pages.settings.addNetworkManually('FLR')
}

export async function runChainlistFlow({ pages }: { pages: PageManager }) {
  await pages.settings.addNetworkFromChainlist('FLOW')
  await pages.settings.editNetwork('FLOW')
  await pages.settings.disableNetwork()
}
