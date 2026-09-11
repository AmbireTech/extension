// jest-environment-jsdom doesn't expose TextEncoder/TextDecoder, which viem needs at import time
const { TextEncoder, TextDecoder } = require('node:util')

global.TextEncoder = global.TextEncoder || TextEncoder
global.TextDecoder = global.TextDecoder || TextDecoder
