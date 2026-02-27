import './RewardsButtonWrapper.css'

import React from 'react'

const RewardsButtonWrapper = ({
  children,
  onPress
}: {
  children: React.ReactNode
  onPress: () => void
}) => {
  return (
    <button type="button" onClick={onPress} className="rewards-button-wrapper">
      {children}
    </button>
  )
}

export default RewardsButtonWrapper
