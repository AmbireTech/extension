import { BadgePreset, Preset } from './types'

const BADGE_PRESETS: { [preset in Preset]: BadgePreset } = {
  'smart-account': {
    text: 'Smart Account',
    type: 'success',
    tooltipText:
      'Smart Accounts unlock the full potential of Ethereum and EVM networks, offering advanced features like paying gas fees in stablecoins, simulating transaction outcomes, and batching multiple actions into a single transaction.'
  },
  'view-only': {
    text: 'view-only',
    type: 'default',
    tooltipText:
      'The "View-only" account is imported without signer keys, meaning you can see its balances, connect it with apps, simulate transactions, and more, but you cannot control it or sign transactions or messages.'
  },
  'ambire-v1': {
    text: 'Ambire v1',
    type: 'primaryAccent',
    tooltipText:
      'Smart Accounts created with the Web or Mobile platforms of Ambire Wallet. You can sign transactions (single and batched ones), connect with apps, and more, but cannot utilize all the features and functionalities of the Ambire Wallet extension.'
  },
  linked: {
    text: 'linked',
    type: 'info',
    tooltipText:
      'Smart Accounts were initially created with a given signer key, but another signer key is authorized for that account on one or more of the supported networks.'
  },
  metamask: {
    text: 'Metamask',
    type: 'warning',
    tooltipText: 'This account has a Metamask EIP-7702 delegation',
    specialType: 'metamask'
  },
  safe: {
    text: 'Safe',
    type: 'success',
    tooltipText: 'This account is a Safe smart account',
    specialType: 'safe'
  }
}

export default BADGE_PRESETS
