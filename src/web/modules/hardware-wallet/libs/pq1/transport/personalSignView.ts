// How the PQ1 shows a personal_sign message, and whether it fits.
//
// The device shows a message whose every byte is printable ASCII or a line
// feed as text, each line feed starting a new row, and anything else as
// hex (`secure/src/tx/display/eip1271.rs` in the firmware repo). It refuses
// a message that doesn't fit its pages, so Ambire applies the same limits
// and sends a message that won't fit as its EIP-191 hash instead (the device
// then shows the hash only).
//
// The vectors in `personalSignView.vectors.json` pin these rules; keep them
// in sync with the firmware when either side changes.

import { MAX_OFFCHAIN_PERSONAL_SIGN_LEN } from '../config'

/** Longest message the device shows as hex. */
const MAX_PERSONAL_SIGN_HEX_LEN = 512
/** Text rows the message pages can hold (24 pages × 3 rows). */
const MAX_PERSONAL_SIGN_TEXT_ROWS = 72
/** Characters per text row on the device's 16-column page. */
const TEXT_COLUMNS = 16

const LINE_FEED = 0x0a

export type PersonalSignView = 'text' | 'hex'

/** `text` when every byte is printable ASCII (0x20..=0x7E) or a line feed
 *  (an empty message is text); `hex` otherwise — carriage returns, tabs,
 *  other control bytes and every non-ASCII byte included. */
export function personalSignView(message: Uint8Array): PersonalSignView {
  const isText = message.every((b) => b === LINE_FEED || (b >= 0x20 && b <= 0x7e))
  return isText ? 'text' : 'hex'
}

/** Rows a text message takes: each line-feed-separated line wraps at 16
 *  columns, and an empty line still takes one row. */
export function personalSignTextRows(message: Uint8Array): number {
  let rows = 0
  let lineLen = 0
  const closeLine = () => {
    rows += Math.max(1, Math.ceil(lineLen / TEXT_COLUMNS))
    lineLen = 0
  }
  for (const b of message) {
    if (b === LINE_FEED) closeLine()
    else lineLen += 1
  }
  closeLine()
  return rows
}

/** Whether the device can show `message` in full as a personal_sign. */
export function personalSignFitsDevice(message: Uint8Array): boolean {
  if (message.length > MAX_OFFCHAIN_PERSONAL_SIGN_LEN) return false
  if (personalSignView(message) === 'hex') return message.length <= MAX_PERSONAL_SIGN_HEX_LEN
  return personalSignTextRows(message) <= MAX_PERSONAL_SIGN_TEXT_ROWS
}
