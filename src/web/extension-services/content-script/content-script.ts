// @ts-nocheck

// Content Script is mainly a relayer between pageContext(injected script) and the background service_worker
import { nanoid } from 'nanoid'

import BroadcastChannelMessage from '@web/extension-services/message/broadcastChannelMessage'
// Middleware for handling messages between dapps and the extension's background process
// import { browserapi, engine } from '@web/constants/browserapi'
import PortMessage from '@web/extension-services/message/portMessage'

const channelName = nanoid()

// the script element with src won't execute immediately
// use inline script element instead!
const container = document.head || document.documentElement
const ele = document.createElement('script')
// in prevent of webpack optimized code do some magic(e.g. double/sigle quote wrap),
// seperate content assignment to two line
// use AssetReplacePlugin to replace pageprovider content
let content = `var channelName = '${channelName}';`
content += '#PAGEPROVIDER#'
ele.textContent = content
container.insertBefore(ele, container.children[0])
container.removeChild(ele)

const pm = new PortMessage().connect()

const bcm = new BroadcastChannelMessage(channelName).listen((data) => pm.request(data))

// background notification
pm.on('message', (data) => bcm.send('message', data))

document.addEventListener('beforeunload', () => {
  bcm.dispose()
  pm.dispose()
})

// TODO: keep alive for manifest v3
// const WORKER_KEEP_ALIVE_INTERVAL = 1000
// const WORKER_KEEP_ALIVE_MESSAGE = 'WORKER_KEEP_ALIVE_MESSAGE'

// const initKeepWorkerAlive = () => {
//   setInterval(() => {
//     browserapi.runtime.sendMessage({ name: WORKER_KEEP_ALIVE_MESSAGE })
//   }, WORKER_KEEP_ALIVE_INTERVAL)
// }

// // Keeps service_worker alive (prevents it to become inactive)
// if (engine === 'webkit') {
//   initKeepWorkerAlive()
// }
