import getCollapseThreshold, { PageMeasurements } from './getCollapseThreshold'

// A 600px list pushed down by a 200px overview, with an 80px floating bar at the bottom,
// so only its top 320px (600 - 200 - 80) shows while the overview is open
const PAGE: Omit<PageMeasurements, 'contentHeight'> = {
  paddingBottom: 20,
  listHeight: 600,
  minContentHeight: 600,
  overviewHeight: 200,
  barReach: 80
}

const NEVER_COLLAPSES = { collapseRoom: 0, collapseThreshold: Infinity }

describe('getCollapseThreshold', () => {
  it('collapses a long page at the height of the overview', () => {
    const result = getCollapseThreshold({ ...PAGE, contentHeight: 3000, minContentHeight: 700 })

    expect(result).toEqual({ collapseRoom: 0, collapseThreshold: 200 })
  })

  it('gives a short page whose end is hidden just enough room to scroll and collapse', () => {
    const result = getCollapseThreshold({ ...PAGE, contentHeight: 550 })

    expect(result).toEqual({ collapseRoom: 52, collapseThreshold: 1 })
  })

  it('collapses a short page at the end of the scroll the banners give it', () => {
    const result = getCollapseThreshold({ ...PAGE, contentHeight: 550, minContentHeight: 700 })

    expect(result).toEqual({ collapseRoom: 52, collapseThreshold: 99 })
  })

  it('never collapses a page whose end shows without collapsing', () => {
    const result = getCollapseThreshold({ ...PAGE, contentHeight: 300 })

    expect(result).toEqual(NEVER_COLLAPSES)
  })

  it('collapses a page whose end only the floating bar hides', () => {
    expect(getCollapseThreshold({ ...PAGE, contentHeight: 380 })).toEqual({
      collapseRoom: 222,
      collapseThreshold: 1
    })
    expect(getCollapseThreshold({ ...PAGE, contentHeight: 380, barReach: 0 })).toEqual(
      NEVER_COLLAPSES
    )
  })

  it('never collapses before the overview is measured', () => {
    const result = getCollapseThreshold({ ...PAGE, contentHeight: 3000, overviewHeight: 0 })

    expect(result).toEqual(NEVER_COLLAPSES)
  })
})
