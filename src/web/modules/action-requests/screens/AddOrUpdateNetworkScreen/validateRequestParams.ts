const validateRequestParams = (kind: string | undefined, params: { [key: string]: any }) => {
  if (!kind) return false
  if (!['walletAddEthereumChain'].includes(kind)) return false

  if (!params) {
    return false
  }

  if (
    !params?.chainId ||
    !params?.rpcUrls ||
    !params?.rpcUrls?.length ||
    !params?.rpcUrls?.[0] ||
    !params?.chainName ||
    !params?.nativeCurrency?.symbol
  ) {
    return false
  }

  try {
    if (!Number(params?.chainId)) return false
  } catch (error) {
    return false
  }

  return true
}

export default validateRequestParams
