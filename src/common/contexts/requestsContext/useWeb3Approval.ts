import useWeb3 from '@mobile/modules/web3/hooks/useWeb3'

const useWeb3Approval = () => {
  const { requests, resolveMany } = useWeb3()

  return {
    requests,
    resolveMany
  }
}

export default useWeb3Approval
