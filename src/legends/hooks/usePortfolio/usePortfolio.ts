import { useContext } from 'react'

import { PortfolioContext } from '@legends/contexts/portfolioContext'

export default function usePortfolio() {
  const context = useContext(PortfolioContext)

  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider')
  }

  return context
}
