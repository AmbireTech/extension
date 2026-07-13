import { ITooltip } from 'react-tooltip'

export * from './GlobalTooltip'

// Used to trigger a tooltip content update from anywhere
// E.g. state changes and you need to update the tooltip text without
// the user moving his pointer
export const GLOBAL_TOOLTIP_REFRESH_EVENT = 'global-tooltip-refresh'

export function createGlobalTooltipDataSet(
  props: Omit<ITooltip, 'render' | 'html' | 'children' | 'wrapper' | 'id'> & {
    // The implementation doesn't work without id
    id: string
  }
) {
  return { tooltip: JSON.stringify(props) }
}
