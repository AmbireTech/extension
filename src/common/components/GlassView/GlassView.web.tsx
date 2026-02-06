import './GlassView.css'

import React from 'react'
import { ViewProps } from 'react-native'

import { GlassViewProps } from './types'

const GlassView: React.FC<GlassViewProps & ViewProps> = ({ children, cssStyle, testID }) => {
  return (
    <>
      <div className="glass-view" style={cssStyle} data-testID={testID}>
        {children}
      </div>
    </>
  )
}

export default GlassView
