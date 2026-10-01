import getNextCollapseState, {
  CollapseState,
  getIsFloatingBarHidden,
  INITIAL_COLLAPSE_STATE
} from './getNextCollapseState'

const LONG_LIST = { contentHeight: 3000, layoutHeight: 500 }
const SHORT_LIST = { contentHeight: 900, layoutHeight: 500 }

const scrollThrough = (offsets: number[], list = LONG_LIST): CollapseState =>
  offsets.reduce(
    (state, offsetY) =>
      getNextCollapseState(state, {
        offsetY,
        ...list,
        scrollDownThreshold: 250,
        collapsibleHeight: 162
      }),
    INITIAL_COLLAPSE_STATE
  )

describe('getNextCollapseState', () => {
  it('stays expanded and shows the bar near the top', () => {
    const state = scrollThrough([0, 20, 40])

    expect(state.isOverviewCollapsed).toBe(false)
    expect(getIsFloatingBarHidden(state)).toBe(false)
  })

  it('hides the bar before collapsing the overview', () => {
    const state = scrollThrough([0, 100, 200])

    expect(state.isOverviewCollapsed).toBe(false)
    expect(getIsFloatingBarHidden(state)).toBe(true)
  })

  it('collapses and hides once scrolled down past the overview', () => {
    const state = scrollThrough([0, 200, 400, 600])

    expect(state.isOverviewCollapsed).toBe(true)
    expect(getIsFloatingBarHidden(state)).toBe(true)
  })

  it('stays collapsed on a short scroll up', () => {
    const state = scrollThrough([0, 600, 1000, 900])

    expect(state.isOverviewCollapsed).toBe(true)
    expect(getIsFloatingBarHidden(state)).toBe(true)
  })

  it('expands and shows the bar once scrolled up far enough', () => {
    const state = scrollThrough([0, 600, 1000, 900, 690])

    expect(state.isOverviewCollapsed).toBe(false)
    expect(getIsFloatingBarHidden(state)).toBe(false)
  })

  it('collapses again when scrolling down after a scroll up', () => {
    const state = scrollThrough([0, 600, 1000, 700, 750])

    expect(state.isOverviewCollapsed).toBe(true)
    expect(getIsFloatingBarHidden(state)).toBe(true)
  })

  it('never collapses a list without enough room to stay collapsed', () => {
    const state = scrollThrough([0, 200, 400], SHORT_LIST)

    expect(state.isOverviewCollapsed).toBe(false)
    expect(getIsFloatingBarHidden(state)).toBe(true)
  })

  it('stays collapsed when the list loses scroll room after collapsing', () => {
    const collapsed = scrollThrough([0, 300, 420])
    const state = getNextCollapseState(collapsed, {
      offsetY: 430,
      contentHeight: 3000,
      // The list grew by the collapsed overview
      layoutHeight: 2600,
      scrollDownThreshold: 250,
      collapsibleHeight: 162
    })

    expect(state.isOverviewCollapsed).toBe(true)
  })
})
