import getCanCollapseOverview, { PageMeasurements } from './getCanCollapseOverview'

// A 600px list padded by a 200px overview, with an 80px floating bar at the bottom,
// so only 320px (600 - 200 - 80) of items show while the overview is open
const PAGE: Omit<PageMeasurements, 'contentHeight'> = {
  paddingBottom: 20,
  listHeight: 600,
  minContentHeight: 600,
  bannersHeight: 0,
  overviewHeight: 200,
  barReach: 80
}

// The overview's padding, the items and the bottom padding
const withItems = (itemsHeight: number) => 200 + itemsHeight + 20

describe('getCanCollapseOverview', () => {
  it('collapses a long page', () => {
    expect(getCanCollapseOverview({ ...PAGE, contentHeight: 3000 })).toBe(true)
  })

  it('collapses a page whose items scroll at all', () => {
    expect(getCanCollapseOverview({ ...PAGE, contentHeight: withItems(400) })).toBe(true)
  })

  it('never collapses a page whose end shows', () => {
    expect(getCanCollapseOverview({ ...PAGE, contentHeight: withItems(300) })).toBe(false)
  })

  it('collapses a page whose end only the floating bar hides', () => {
    expect(getCanCollapseOverview({ ...PAGE, contentHeight: withItems(350) })).toBe(true)
    expect(getCanCollapseOverview({ ...PAGE, contentHeight: withItems(350), barReach: 0 })).toBe(
      false
    )
  })

  it('never collapses a page that only scrolls the banners away', () => {
    const result = getCanCollapseOverview({
      ...PAGE,
      bannersHeight: 100,
      minContentHeight: 700,
      contentHeight: 100 + withItems(300)
    })
    expect(result).toBe(false)
  })

  it('never collapses before the overview is measured', () => {
    expect(getCanCollapseOverview({ ...PAGE, contentHeight: 3000, overviewHeight: 0 })).toBe(false)
  })
})
