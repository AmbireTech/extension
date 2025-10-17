import { getAddress, Interface } from 'ethers'

import { Legends as LEGENDS_CONTRACT_ABI } from '@ambire-common/libs/humanizer/const/abis/Legends'
import { LEGENDS_CONTRACT_ADDRESS } from '@legends/constants/addresses'
import useErc5792 from '@legends/hooks/useErc5792'
import useProviderContext from '@legends/hooks/useProviderContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'

const LEGENDS_CONTRACT_INTERFACE = new Interface(LEGENDS_CONTRACT_ABI)

const useInviteCard = ({
  address,
  setAddress
}: {
  address: string
  setAddress: (address: string) => void
}) => {
  const switchNetwork = useSwitchNetwork()
  const { browserProvider } = useProviderContext()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()

  const inviteEOA = async (): Promise<string> => {
    if (!browserProvider) return ''
    setAddress('')
    const checksummedAddress = getAddress(address)

    const signer = await browserProvider.getSigner()

    // no sponsorship for inviteEOA
    const useSponsorship = false

    const sendCallsIdentifier = await sendCalls(
      chainId,
      await signer.getAddress(),
      [
        {
          to: LEGENDS_CONTRACT_ADDRESS,
          data: LEGENDS_CONTRACT_INTERFACE.encodeFunctionData('invite', [checksummedAddress])
        }
      ],
      useSponsorship
    )
    const receipt = await getCallsStatus(sendCallsIdentifier)

    return receipt.transactionHash
  }

  return {
    inviteEOA,
    switchNetwork,
    address
  }
}

export default useInviteCard
