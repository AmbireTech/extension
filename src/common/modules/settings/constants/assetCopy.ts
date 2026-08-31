import { CustomToken } from '@ambire-common/libs/portfolio/customToken'

/** The copy of the custom and hidden assets, per standard, extractable for translation */
export const ASSET_COPY: {
  [standard in CustomToken['standard']]: {
    listColumn: string
    customSectionTitle: string
    hiddenSectionTitle: string
    addButton: string
    searchPlaceholder: string
    emptyCustom: { noFilters: string; search: string; network: string; searchAndNetwork: string }
    emptyHidden: { noFilters: string; search: string; network: string; searchAndNetwork: string }
    unhiddenToast: string
    hiddenToast: string
    removedToast: string
  }
} = {
  ERC20: {
    listColumn: 'Token',
    customSectionTitle: 'Custom tokens',
    hiddenSectionTitle: 'Hidden tokens',
    addButton: 'Add custom token',
    searchPlaceholder: 'Search tokens',
    emptyCustom: {
      noFilters: "You don't have any custom tokens",
      search: 'No custom tokens found',
      network: 'No custom tokens found on this network',
      searchAndNetwork: 'No custom tokens found for these filters'
    },
    emptyHidden: {
      noFilters: "You don't have any hidden tokens",
      search: 'No hidden tokens found',
      network: 'No hidden tokens found on this network',
      searchAndNetwork: 'No hidden tokens found for these filters'
    },
    unhiddenToast: 'Token is now visible. You can hide it again from the dashboard.',
    hiddenToast: 'Token is now hidden. You can unhide it from Settings > Custom assets.',
    removedToast: 'Token removed'
  },
  ERC721: {
    listColumn: 'NFT',
    customSectionTitle: 'Custom NFTs',
    hiddenSectionTitle: 'Hidden NFTs',
    addButton: 'Add custom NFT',
    searchPlaceholder: 'Search NFTs',
    emptyCustom: {
      noFilters: "You don't have any custom NFTs",
      search: 'No custom NFTs found',
      network: 'No custom NFTs found on this network',
      searchAndNetwork: 'No custom NFTs found for these filters'
    },
    emptyHidden: {
      noFilters: "You don't have any hidden NFTs",
      search: 'No hidden NFTs found',
      network: 'No hidden NFTs found on this network',
      searchAndNetwork: 'No hidden NFTs found for these filters'
    },
    unhiddenToast: 'The NFT is visible again.',
    hiddenToast: 'The NFT is now hidden. You can unhide it from Settings > Custom assets.',
    removedToast: 'NFT removed'
  }
}

export default ASSET_COPY
