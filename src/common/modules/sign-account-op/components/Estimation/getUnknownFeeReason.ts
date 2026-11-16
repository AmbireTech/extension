/**
 * Why a fee option has no fee amount at all, as opposed to a balance that can't cover it: the fee
 * is estimated in the network's native token and converted to the option's token by price, so
 * without a USD price for the native token (`unpricedNativeTokenSymbol`) no option other than the
 * native token itself (e.g. the Gas Tank) can be priced. Null when that's not the case.
 */
const getUnknownFeeReason = (
  feeSpeeds: readonly unknown[] | undefined,
  unpricedNativeTokenSymbol: string | null | undefined
): string | null => {
  // Speeds left empty (rather than not calculated yet) are the ones that couldn't be worked out
  if (feeSpeeds?.length !== 0 || !unpricedNativeTokenSymbol) return null

  return `No ${unpricedNativeTokenSymbol} price to calculate the fee`
}

export default getUnknownFeeReason
