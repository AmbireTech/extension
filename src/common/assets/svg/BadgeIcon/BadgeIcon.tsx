import React from 'react'
import Svg, { G, Path, Rect, SvgProps } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

const BadgeIcon: React.FC<SvgProps> = ({ width = 24, height = 24, color, ...rest }) => {
    const { theme } = useTheme()
    const strokeColor = color || theme.iconSecondary
    
    return (
        <Svg width={width} height={height} viewBox="0 0 24 24" {...rest}>
            <G id="send_icon" transform="translate(0.001 -0.778)">
                <Rect id="Boundary" width="24" height="24" transform="translate(-0.001 24.778) rotate(-90)" fill="none"/>
                <G id="Group_5496" transform="translate(1.98 2.852)">
                    <Path 
                        id="Path_18008" 
                        d="M19,9a6.953,6.953,0,0,0-5.95-6.91,6.17,6.17,0,0,0-2.1,0A6.995,6.995,0,1,0,19,9Z" 
                        transform="translate(-1.98 3.848)" 
                        fill="none" 
                        stroke={strokeColor} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="1.5"
                    />
                    <Path 
                        id="Path_18009" 
                        d="M21.25,16.278l-1.65-.39a.981.981,0,0,1-.74-.74l-.35-1.47a1,1,0,0,0-1.74-.41L12,18.748l-4.77-5.49a1,1,0,0,0-1.74.41l-.35,1.47a1,1,0,0,1-.74.74l-1.65.39a1,1,0,0,0-.48,1.68l3.9,3.9a6.985,6.985,0,0,1,4.78-3.02,6.17,6.17,0,0,1,2.1,0,6.985,6.985,0,0,1,4.78,3.02l3.9-3.9A1,1,0,0,0,21.25,16.278Z" 
                        transform="translate(-1.979 -12.9)" 
                        fill="none" 
                        stroke={strokeColor} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="1.5"
                    />
                    <Path 
                        id="Path_18010" 
                        d="M12.579,5.98l.59,1.18a.724.724,0,0,0,.48.35l1.07.18c.68.11.84.61.35,1.1l-.83.83a.708.708,0,0,0-.17.61l.24,1.03c.19.81-.24,1.13-.96.7l-1-.59a.7.7,0,0,0-.66,0l-1,.59c-.72.42-1.15.11-.96-.7l.24-1.03a.75.75,0,0,0-.17-.61l-.83-.83c-.49-.49-.33-.98.35-1.1l1.07-.18a.729.729,0,0,0,.47-.35l.59-1.18C11.74,5.34,12.26,5.34,12.579,5.98Z" 
                        transform="translate(-1.98 4.022)" 
                        fill="none" 
                        stroke={strokeColor} 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth="1.5"
                    />
                </G>
            </G>
        </Svg>
    )
}

export default React.memo(BadgeIcon)
