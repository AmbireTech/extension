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
  holdToProceedButtonText: string
  shouldRejectOnchain: boolean
  isRejectDisabled: boolean
  holdToProceedButtonType?: 'dangerFilled' | 'warning' | 'primary'
  signButtonType?: 'dangerFilled' | 'warning' | 'primary'
  /**
   * When set, there's nothing left to sign (e.g. the transaction being sped up was already
   * processed), so the footer shows only a Close button that calls it
   */
  onClose?: () => void
}

declare const Footer: React.FC<Props>

export default Footer
