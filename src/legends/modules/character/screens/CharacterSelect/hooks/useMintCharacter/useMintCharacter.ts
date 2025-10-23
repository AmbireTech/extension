/* eslint-disable no-console */
import { ethers, JsonRpcProvider } from 'ethers'
import { useCallback, useEffect, useRef, useState } from 'react'

import { REWARDS_NFT_ADDRESS } from '@legends/constants/addresses'
import { RETRY_OR_SUPPORT_MESSAGE } from '@legends/constants/errors/messages'
import { ETHEREUM_CHAIN_ID } from '@legends/constants/networks'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useProviderContext from '@legends/hooks/useProviderContext'
import useSwitchNetwork from '@legends/hooks/useSwitchNetwork'
import useToast from '@legends/hooks/useToast'
import { CURRENT_SEASON } from '@legends/modules/legends/constants'
import { humanizeError } from '@legends/modules/legends/utils/errors/humanizeError'

enum CharacterLoadingMessage {
  Initial = 'Initializing character setup...',
  Signing = 'Connecting to the blockchain, please sign your transaction so we can proceed',
  Minting = 'Securing NFT...',
  Minted = 'Finalizing details...'
}

const REWARDS_NFT_ABI = [
  'function mint(uint type, uint season) public returns()',
  'function nftTypes(address identity, uint season) public view returns(uint)'
]

let pollAttempts = 0

const useMintCharacter = () => {
  const { addToast } = useToast()
  const { browserProvider } = useProviderContext()
  const { connectedAccount } = useAccountContext()
  const { getCharacter, character } = useCharacterContext()
  const { sendCalls, getCallsStatus, chainId } = useErc5792()
  const switchNetwork = useSwitchNetwork()

  const [isCheckingMintStatus, setIsCheckingMintStatus] = useState(true)
  const [isMinting, setIsMinting] = useState(false)
  const [isMinted, setIsMinted] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<CharacterLoadingMessage>(
    CharacterLoadingMessage.Initial
  )

  // Reference to the current character state to avoid stale closures in
  // async function below pollForCharacterAfterMint
  const characterRef = useRef(character)
  useEffect(() => {
    characterRef.current = character
  }, [character])

  const getCharacterNFTData = useCallback(async (): Promise<{
    isMinted: boolean
    nftId?: bigint
  }> => {
    if (!connectedAccount)
      return {
        isMinted: false
      }
    const provider = new JsonRpcProvider('https://invictus.ambire.com/ethereum')

    const nftContract = new ethers.Contract(REWARDS_NFT_ADDRESS, REWARDS_NFT_ABI, provider)

    try {
      const nftId = await nftContract.nftTypes(connectedAccount, CURRENT_SEASON)
      return {
        isMinted: !!nftId,
        nftId
      }
    } catch (e) {
      console.error('Error checking mint status:', e)
      return {
        isMinted: false
      }
    }
  }, [connectedAccount])

  // The transaction may be confirmed but the relayer may not have updated the character's metadata yet.
  const pollForCharacterAfterMint = useCallback(async () => {
    const checkCharacter = async () => {
      if (pollAttempts > 20) {
        addToast(
          'We are unable to retrieve your character at this time. Please reload the page or contact support.',
          { type: 'error' }
        )
        setIsMinting(false)
        return
      }

      await getCharacter()
      pollAttempts++

      if (characterRef.current) {
        setIsMinting(false)
        setIsMinted(true)
        return
      }

      setTimeout(checkCharacter, 1000)
    }

    await checkCharacter()
  }, [getCharacter, addToast])

  const mintCharacter = useCallback(
    async (type: number) => {
      try {
        if (!browserProvider) return
        await switchNetwork(ETHEREUM_CHAIN_ID)
        setIsMinting(true)
        setLoadingMessage(CharacterLoadingMessage.Signing)

        const signer = await browserProvider.getSigner()

        // Create a contract instance
        const nftContract = new ethers.Contract(REWARDS_NFT_ADDRESS, REWARDS_NFT_ABI, signer)
        const sendCallsIdentifier = await sendCalls(chainId, await signer.getAddress(), [
          {
            to: REWARDS_NFT_ADDRESS,
            data: nftContract.interface.encodeFunctionData('mint', [type, CURRENT_SEASON])
          }
        ])

        setLoadingMessage(CharacterLoadingMessage.Minting)

        await getCallsStatus(sendCallsIdentifier, false)

        setLoadingMessage(CharacterLoadingMessage.Minted)
        // Transaction was successful, call getCharacter
        await pollForCharacterAfterMint()
        // Purposely not setting isMinting to false as we want to
        // keep the modal displayed until the character is loaded
        // in state
      } catch (e) {
        setIsMinting(false)
        const message = humanizeError(
          e,
          `An error occurred during the NFT minting process. ${RETRY_OR_SUPPORT_MESSAGE}`
        )

        addToast(message, { type: 'error' })
        console.log('Error during minting process:', e)
      }
    },
    [addToast, pollForCharacterAfterMint, sendCalls, getCallsStatus, chainId, switchNetwork]
  )

  useEffect(() => {
    setIsCheckingMintStatus(true)
    getCharacterNFTData()
      .then(({ isMinted: newIsMinted }) => {
        setIsMinted(newIsMinted)
        if (newIsMinted) {
          setLoadingMessage(CharacterLoadingMessage.Minted)
        }
      })
      .catch((e) => {
        setIsMinted(false)
        console.error(e)
      })
      .finally(() => {
        setIsCheckingMintStatus(false)
      })
  }, [getCharacterNFTData])

  return {
    isMinting,
    loadingMessage,
    mintCharacter,
    isMinted,
    isCheckingMintStatus
  }
}

export default useMintCharacter
