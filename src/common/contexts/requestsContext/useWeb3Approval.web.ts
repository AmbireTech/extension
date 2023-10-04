import useApproval from '@web/hooks/useApproval'

const useWeb3Approval = () => {
  const { requests, resolveMany } = useApproval()

  return {
    requests,
    resolveMany
  }
}

export default useWeb3Approval
