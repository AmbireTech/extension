import { JsonRpcProvider, Interface } from 'ethers'

const EP = '0x6818809EefCe719E480a7526D76bD3e561526b46'
const DEPLOY = 22153713
const p = new JsonRpcProvider('https://invictus.ambire.com/ethereum', undefined, { staticNetwork: true })

const ep = new Interface([
  'event PoolRegistered(address _pool, address _asset, uint256 _scope)',
  'event RootUpdated(uint256 _root, string _ipfsCID, uint256 _timestamp)',
  'event Deposited(address indexed _depositor, address indexed _pool, uint256 _commitment, uint256 _amount)'
])
const topic = ep.getEvent('PoolRegistered').topicHash

// Pools are registered soon after deployment; a few windows are enough to enumerate them
const pools = []
for (let i = 0; i < 6; i++) {
  const from = DEPLOY + i * 5000
  const logs = await p.getLogs({ address: EP, topics: [topic], fromBlock: from, toBlock: from + 4999 })
  for (const l of logs) {
    const d = ep.parseLog(l)
    pools.push({ pool: d.args._pool, asset: d.args._asset, scope: d.args._scope.toString(), block: l.blockNumber })
  }
}
console.log(`PoolRegistered found in the first 30k blocks: ${pools.length}`)

const pool = new Interface([
  'function nonce() view returns (uint256)',
  'function currentRoot() view returns (uint256)',
  'function currentTreeSize() view returns (uint256)'
])
let totalDeposits = 0n
for (const x of pools) {
  const out = {}
  for (const fn of ['nonce', 'currentTreeSize']) {
    try {
      const r = await p.call({ to: x.pool, data: pool.encodeFunctionData(fn, []) })
      out[fn] = pool.decodeFunctionResult(fn, r)[0]
    } catch { out[fn] = 'n/a' }
  }
  totalDeposits += typeof out.nonce === 'bigint' ? out.nonce : 0n
  console.log(`  pool ${x.pool} asset ${x.asset}`)
  console.log(`    deposits(nonce)=${out.nonce}  treeSize=${out.currentTreeSize}  scope=${x.scope}`)
}
console.log(`\ntotal deposits across these pools: ${totalDeposits}`)
