import getNextOverviewCollapse, {
  INITIAL_OVERVIEW_COLLAPSE,
  OVERVIEW_RETURN_DISTANCE,
  OverviewCollapse
} from './getNextOverviewCollapse'

const LAYOUT = { bannersHeight: 50, overviewHeight: 160 }

const scrollThrough = (offsets: number[]): OverviewCollapse =>
  offsets.reduce(
    (state, offsetY) => getNextOverviewCollapse(state, offsetY, LAYOUT),
    INITIAL_OVERVIEW_COLLAPSE
  )

describe('getNextOverviewCollapse', () => {
  it('stays open while the banners scroll away', () => {
    expect(scrollThrough([0, 20, 50]).collapsed).toBe(0)
  })

  it('collapses with the scroll once past the banners', () => {
    expect(scrollThrough([0, 50, 130]).collapsed).toBe(80)
    expect(scrollThrough([0, 50, 130, 90]).collapsed).toBe(40)
    expect(scrollThrough([0, 1000]).collapsed).toBe(160)
  })

  it('stays collapsed on a short scroll up mid-page', () => {
    expect(scrollThrough([0, 1000, 1000 - OVERVIEW_RETURN_DISTANCE]).collapsed).toBe(160)
  })

  it('expands with the scroll up past the return distance mid-page', () => {
    const returnStart = 1000 - OVERVIEW_RETURN_DISTANCE

    expect(scrollThrough([0, 1000, returnStart - 60]).collapsed).toBe(100)
    expect(scrollThrough([0, 1000, returnStart - 500]).collapsed).toBe(0)
  })

  it('collapses with the scroll down right after expanding mid-page', () => {
    expect(scrollThrough([0, 1000, 500, 530]).collapsed).toBe(30)
  })

  it('opens fully at the top, however it was scrolled', () => {
    expect(scrollThrough([0, 1000, 900, 950, 0]).collapsed).toBe(0)
  })
})
