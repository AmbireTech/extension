import {
  getNextReturnDistance,
  getOverviewCollapsed,
  getSettleOffset,
  OVERVIEW_RETURN_DISTANCE
} from './overviewCollapse'

const BANNERS_HEIGHT = 50
const OVERVIEW_HEIGHT = 160

// What the carousel does on every scroll event of the open page
const scrollThrough = (offsets: number[]) => {
  let offsetY = 0
  let returnDistance = 0

  offsets.forEach((nextOffsetY) => {
    returnDistance = getNextReturnDistance(returnDistance, nextOffsetY - offsetY, OVERVIEW_HEIGHT)
    offsetY = nextOffsetY
  })

  return getOverviewCollapsed(offsetY, returnDistance, BANNERS_HEIGHT, OVERVIEW_HEIGHT)
}

describe('getOverviewCollapsed', () => {
  it('stays open while the banners scroll away', () => {
    expect(scrollThrough([20, 50])).toBe(0)
  })

  it('collapses with the scroll once past the banners', () => {
    expect(scrollThrough([50, 130])).toBe(80)
    expect(scrollThrough([50, 130, 90])).toBe(40)
    expect(scrollThrough([1000])).toBe(160)
  })

  it('stays collapsed on a short scroll up mid-page', () => {
    expect(scrollThrough([1000, 1000 - OVERVIEW_RETURN_DISTANCE])).toBe(160)
  })

  it('expands with the scroll up past the return distance mid-page', () => {
    const returnStart = 1000 - OVERVIEW_RETURN_DISTANCE

    expect(scrollThrough([1000, returnStart - 60])).toBe(100)
    expect(scrollThrough([1000, returnStart - 500])).toBe(0)
  })

  it('collapses with the scroll down right after expanding mid-page', () => {
    expect(scrollThrough([1000, 500, 530])).toBe(30)
  })

  it('opens fully at the top, however it was scrolled', () => {
    expect(scrollThrough([1000, 900, 950, 0])).toBe(0)
  })
})

describe('getSettleOffset', () => {
  it('leaves a fully open or collapsed overview alone', () => {
    expect(getSettleOffset(500, 0, OVERVIEW_HEIGHT)).toBeNull()
    expect(getSettleOffset(500, 0.5, OVERVIEW_HEIGHT)).toBeNull()
    expect(getSettleOffset(500, OVERVIEW_HEIGHT, OVERVIEW_HEIGHT)).toBeNull()
  })

  it('scrolls back up by the collapse to open it', () => {
    expect(getSettleOffset(500, 60, OVERVIEW_HEIGHT)).toBe(440)
  })

  it('scrolls on down by the rest to collapse it', () => {
    expect(getSettleOffset(500, 100, OVERVIEW_HEIGHT)).toBe(560)
  })
})
