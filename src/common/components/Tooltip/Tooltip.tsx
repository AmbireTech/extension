import React from 'react'
import { ITooltip, Tooltip as ReactTooltip } from 'react-tooltip'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import { Portal } from '@gorhom/portal'

type Props = ITooltip & {
  tooltipRef?: any
  withPortal?: boolean
}

const TooltipInner = ({ tooltipRef, style, border, ...rest }: Props) => {
  const { theme } = useTheme()

  return (
    <ReactTooltip
      ref={tooltipRef}
      place="top"
      delayShow={150}
      variant="light"
      style={{
        maxWidth: 380,
        fontSize: 14,
        fontFamily: FONT_FAMILIES.REGULAR,
        backgroundColor: theme.tertiaryBackground as any,
        color: theme.secondaryText as any,
        borderRadius: BORDER_RADIUS_PRIMARY,
        zIndex: 1000,
        boxShadow: '0px 4px 8px #1418333D',
        ...style
      }}
      opacity={1}
      border={border || `1px solid ${theme.secondaryBorder as any}`}
      {...rest}
    />
  )
}

const Tooltip = ({ tooltipRef, withPortal = true, style, ...rest }: Props) => {
  if (!withPortal)
    return <TooltipInner withPortal={withPortal} tooltipRef={tooltipRef} style={style} {...rest} />

  return (
    <Portal hostName="global">
      <TooltipInner withPortal={withPortal} tooltipRef={tooltipRef} style={style} {...rest} />
    </Portal>
  )
}

export default Tooltip
