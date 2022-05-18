// @ts-nocheck

import networks from 'ambire-common/src/constants/networks'

import { names, tokens } from '@modules/common/constants/humanizerInfo.json'
import humanizers from '@modules/common/services/humanizers'

import { getName, nativeToken } from './humanReadableTransactions'

// This function is moved away from the `humanReadableTransactions` main file,
// because the `humanizers` import is causing a require cycle between
//   1) humanReadableTransactions/index.ts ->
//   2) humanizers/index.ts ->
//   3) humanizers/YearnVault.ts (and all others) ->
//   4) humanReadableTransactions/index.ts
export function getTransactionSummary(txn, networkId, accountAddr, opts = {}) {
  const [to, value, data = '0x'] = txn
  const network = networks.find((x) => x.id === networkId || x.chainId === networkId)
  if (!network) return 'Unknown network (unable to parse)'

  if (to === '0x' || !to) {
    return 'Deploy contract'
  }

  const tokenInfo = tokens[to.toLowerCase()]
  const name = names[to.toLowerCase()]

  if (data === '0x' && to.toLowerCase() === accountAddr.toLowerCase()) {
    // Doesn't matter what the value is, this is always a no-op
    return !opts.extended ? 'Transaction cancellation' : [['Cancel', 'transaction']]
  }

  let callSummary
  let sendSummary
  if (parseInt(value) > 0)
    sendSummary = !opts.extended
      ? `send ${nativeToken(network, value)} to ${name || to}`
      : [
          'Send',
          {
            type: 'token',
            ...nativeToken(network, value, true)
          },
          'to',
          {
            type: 'address',
            address: to,
            name: getName(to, network)
          }
        ]

  if (data !== '0x') {
    callSummary = !opts.extended
      ? `Unknown interaction with ${name || (tokenInfo ? tokenInfo[0] : to)}`
      : [
          'unknown',
          'interaction with',
          {
            type: 'address',
            address: to,
            name: name || (tokenInfo && tokenInfo[0])
          }
        ]

    const sigHash = data.slice(0, 10)
    const humanizer = humanizers[sigHash]
    if (humanizer) {
      try {
        const actions = humanizer({ to, value, data, from: accountAddr }, network, opts)
        return opts.extended === true ? actions : actions.join(', ')
      } catch (e) {
        callSummary = opts.extended
          ? callSummary.concat(['(unable to parse)'])
          : `${callSummary} (unable to parse)`
      }
    }
  }

  const filteredSummary = [callSummary, sendSummary].filter((x) => x)
  return !opts.extended ? filteredSummary.join(', ') : filteredSummary
}
