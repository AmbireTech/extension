export type Props = {
  onReject: () => void
  onAddToCart: () => void
  onSign: () => void
  isSignLoading: boolean
  isSignDisabled: boolean
  isAddToCartDisplayed: boolean
  isAddToCartDisabled: boolean
  inProgressButtonText: string
  buttonText: string
  buttonTooltipText?: string
  shouldHoldToProceed: boolean
}

declare const Footer: React.FC<Props>

export default Footer
