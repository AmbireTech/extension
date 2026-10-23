import vectors from './personalSignView.vectors.json'
import { hexToBytes } from './bytes'
import { personalSignFitsDevice, personalSignTextRows, personalSignView } from './personalSignView'

describe('personal_sign view', () => {
  it.each(vectors.vectors)('$name', (v) => {
    const message = hexToBytes(v.message as `0x${string}`)
    expect(personalSignView(message)).toBe(v.view)
    if ('textRows' in v) expect(personalSignTextRows(message)).toBe(v.textRows)
    expect(personalSignFitsDevice(message)).toBe(v.fits)
  })
})
