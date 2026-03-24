import { ITooltip } from 'react-tooltip'

export * from './GlobalTooltip'

export function createGlobalTooltipDataSet(
  props: Omit<ITooltip, 'render' | 'html' | 'children' | 'wrapper' | 'id'> & {
    // The implementation doesn't work without id
    id: string
  }
) {
  return { tooltip: JSON.stringify(props) }
}
