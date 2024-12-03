import { ethers, ZeroAddress, zeroPadValue } from 'ethers'
import { useCallback, useEffect, useRef, useState } from 'react'

import LegendsNFT from '@contracts/compiled/LegendsNft.json'
import { LEGENDS_NFT_ADDRESS } from '@env'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import useErc5792 from '@legends/hooks/useErc5792'
import useToast from '@legends/hooks/useToast'

enum CharacterLoadingMessage {
  Initial = 'Initializing character setup...',
  Signing = 'Connecting to the blockchain, please sign your transaction so we can proceed',
  Minting = 'Securing NFT...',
  Minted = 'Finalizing details...'
}

const MINT_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const BASE_BLOCK_TIME_SECONDS = 2
const FIVE_MINUTES_IN_BLOCKS = (5 * 60) / BASE_BLOCK_TIME_SECONDS

async function getMintingTimestamp(provider: any, accountAddress: string, tokenId: number) {
  const currentBlock = await provider.getBlockNumber()
  const hexTokenId = `0x${tokenId.toString(16)}`
  const filter = {
    address: LEGENDS_NFT_ADDRESS,
    topics: [
      MINT_TOPIC,
      zeroPadValue(ZeroAddress, 32),
      zeroPadValue(accountAddress, 32),
      zeroPadValue(hexTokenId, 32)
    ],
    fromBlock: currentBlock - FIVE_MINUTES_IN_BLOCKS,
    toBlock: currentBlock
  }

  const events = await provider.getLogs(filter)

  if (events.length > 0) {
    const mintEvent = events[0]
    const block = await provider.getBlock(mintEvent.blockNumber)
    if (!block) return 0

    return block.timestamp * 1000 // ms
  }

  return 'past-block-watch'
}

type MintedAt = number | 'past-block-watch' | null

const useMintCharacter = () => {
  const { addToast } = useToast()
  const { connectedAccount } = useAccountContext()
  const { getCharacter, character } = useCharacterContext()
  const { sendCalls, getCallsStatus } = useErc5792()

  const [isCheckingMintStatus, setIsCheckingMintStatus] = useState(true)
  const [isMinting, setIsMinting] = useState(false)
  const [isMinted, setIsMinted] = useState(false)
  const [mintedAt, setMintedAt] = useState<MintedAt>(null)
  const [loadingMessage, setLoadingMessage] = useState<CharacterLoadingMessage>(
    CharacterLoadingMessage.Initial
  )

  // Reference to the current character state to avoid stale closures in
  // async function below pollForCharacterAfterMint
  const characterRef = useRef(character)
  useEffect(() => {
    characterRef.current = character
  }, [character])

  const getCharacterNFTData = useCallback(async () => {
    if (!connectedAccount)
      return {
        mintedAt: null,
        isMinted: false
      }

    const provider = new ethers.BrowserProvider(window.ambire)

    const signer = await provider.getSigner()

    const abi = LegendsNFT.abi
    const nftContract = new ethers.Contract(LEGENDS_NFT_ADDRESS, abi, signer)

    try {
      let mintedAtTimestamp: MintedAt = null
      // Check if the user already owns an NFT
      const characterMinted = await nftContract.balanceOf(signer.getAddress())

      if (characterMinted) {
        const nftTokenId = await nftContract.tokenOfOwnerByIndex(signer.getAddress(), 0)

        mintedAtTimestamp = await getMintingTimestamp(provider, connectedAccount, nftTokenId).catch(
          (e) => {
            console.error(e)

            return null
          }
        )
      }

      return {
        mintedAt: mintedAtTimestamp,
        isMinted: characterMinted
      }
    } catch (e) {
      console.error('Error checking mint status:', e)
      return {
        mintedAt: null,
        isMinted: false
      }
    }
  }, [connectedAccount])

  // The transaction may be confirmed but the relayer may not have updated the character's metadata yet.
  const pollForCharacterAfterMint = useCallback(() => {
    const checkCharacter = async () => {
      await getCharacter()

      if (characterRef.current) {
        return
      }

      setTimeout(checkCharacter, 1000)
    }

    checkCharacter()
  }, [getCharacter, characterRef])

  const mintCharacter = useCallback(
    async (type: number) => {
      const chainId = '0x2105'

      // Switch to Base chain
      await window.ambire.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }] // chainId must be in hexadecimal numbers
      })

      setIsMinting(true)
      setLoadingMessage(CharacterLoadingMessage.Signing)

      const provider = new ethers.BrowserProvider(window.ambire)

      const signer = await provider.getSigner()

      const abi = LegendsNFT.abi

      // Create a contract instance
      const nftContract = new ethers.Contract(LEGENDS_NFT_ADDRESS, abi, signer)

      try {
        const sendCallsIdentifier = await sendCalls(chainId, await signer.getAddress(), [
          {
            to: LEGENDS_NFT_ADDRESS,
            data: nftContract.interface.encodeFunctionData('mint', [type])
          }
        ])

        setLoadingMessage(CharacterLoadingMessage.Minting)

        const receipt = await getCallsStatus(sendCallsIdentifier)
        if (receipt.status === '0x1') {
          setLoadingMessage(CharacterLoadingMessage.Minted)
          // Transaction was successful, call getCharacter
          await pollForCharacterAfterMint()
          // Purposely not setting isMinting to false as we want to
          // keep the modal displayed until the character is loaded
          // in state
        } else {
          addToast('Error selecting a character: The transaction failed!', 'error')
        }
      } catch (e) {
        setIsMinting(false)
        addToast('Error during minting process!', 'error')
        console.log('Error during minting process:', e)
      }
    },
    [addToast, pollForCharacterAfterMint, sendCalls, getCallsStatus]
  )

  useEffect(() => {
    setIsCheckingMintStatus(true)
    getCharacterNFTData()
      .then(({ mintedAt: newMintedAt, isMinted: newIsMinted }) => {
        setMintedAt(newMintedAt)
        setIsMinted(newIsMinted)
      })
      .catch((e) => {
        setIsMinted(false)
        setMintedAt(null)
        console.error(e)
      })
      .finally(() => {
        setIsCheckingMintStatus(false)
      })
  }, [getCharacterNFTData])

  return {
    isMinting,
    mintedAt,
    loadingMessage,
    mintCharacter,
    isMinted,
    isCheckingMintStatus
  }
}

export default useMintCharacter
