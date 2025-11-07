import { Contract, JsonRpcProvider } from 'ethers'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { LEGENDS_NFT_ADDRESS } from '@env'
import Modal from '@legends/components/Modal'
import Spinner from '@legends/components/Spinner'
import { REWARDS_NFT_ADDRESS } from '@legends/constants/addresses'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import { CURRENT_SEASON } from '@legends/modules/legends/constants'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants'

import blurredLights from './blurred-lights-wide.png'
import styles from './CharacterSelect.module.scss'
import CharacterLoadingModal from './components/CharacterLoadingModal'
import CharacterSlider from './components/CharacterSlider'
import useMintCharacter from './hooks/useMintCharacter'

interface CharacterSelectProps {
  onClose: () => void
  isOpen: boolean
}

const CharacterSelect = ({ onClose, isOpen }: CharacterSelectProps) => {
  const navigate = useNavigate()
  const [characterId, setCharacterId] = useState(1)
  const { connectedAccount, v1Account } = useAccountContext()
  const [errorMessage, setErrorMessage] = useState('')
  const [isOpenNewNftAlert, setIsOpenNewNftAlert] = useState(false)
  const [hasStartedMinting, setHasStartedMinting] = useState(false)

  const { character, isLoading, isCharacterNotMinted } = useCharacterContext()

  const { isMinting, isMinted, loadingMessage, isCheckingMintStatus, mintCharacter } =
    useMintCharacter()

  useEffect(() => {
    if (isMinted) {
      onClose()
    }
  }, [character, isMinted, connectedAccount, isLoading, isMinting, onClose])

  const onCharacterChange = (id: number) => {
    setCharacterId(id)
  }

  const redirectToCharacterPage = () => {
    navigate(LEGENDS_ROUTES.home)
  }

  useEffect(() => {
    document.title = 'Ambire Rewards'
  }, [])

  const isButtonDisabled = isMinting || isLoading || isMinted

  useEffect(() => {
    const baseProvider = new JsonRpcProvider('https://invictus.ambire.com/base')
    const ethereumProvider = new JsonRpcProvider('https://invictus.ambire.com/ethereum')
    const oldNft = new Contract(
      LEGENDS_NFT_ADDRESS,
      ['function balanceOf(address) public view returns(uint)'],
      baseProvider
    )
    const newNft = new Contract(
      REWARDS_NFT_ADDRESS,
      ['function balanceOf(address) public view returns(uint)'],
      ethereumProvider
    )
    Promise.all([oldNft.balanceOf(connectedAccount), newNft.balanceOf(connectedAccount)])
      .then(([hasOldNft, hasNewNft]: [bigint, bigint]) =>
        // since the user will see this screen only if he does not have
        // the nft from the current season, it is ok to not exclude the
        // current season's nft from the balanceOf() call from the new contract
        setIsOpenNewNftAlert(!!hasOldNft || !!hasNewNft)
      )
      .catch((e) => console.log('Failed to get info about NFT balance', e))
  }, [connectedAccount])

  if (!isOpen) {
    return null
  }
  return (
    <Modal className={styles.wrapper} isOpen handleClose={onClose}>
      <div
        className={styles.backgroundEffect}
        style={{ backgroundImage: `url(${blurredLights})` }}
      />
      <div>
        <h1 className={styles.title}>Pick Your Avatar</h1>
      </div>

      <div>
        <CharacterSlider initialCharacterId={characterId} onCharacterChange={onCharacterChange} />
        {!isCheckingMintStatus && (
          <button
            onClick={() => {
              if (!isButtonDisabled) {
                setHasStartedMinting(true)
                mintCharacter(characterId).catch(() =>
                  setErrorMessage('We failed to fetch NFT info.')
                )
              }
            }}
            type="button"
            disabled={isButtonDisabled}
            className={styles.saveButton}
          >
            {isMinting ? 'Please wait...' : 'Continue'}
          </button>
        )}
        {isCheckingMintStatus && <Spinner />}
      </div>

      <Modal isOpen={isOpenNewNftAlert} isClosable={false} className={styles.modal}>
        <div className={styles.modalContent}>
          <Modal.Heading className={styles.modalHeading}>
            Creating Your New Character NFT
          </Modal.Heading>
          <Modal.Text className={styles.modalText}>
            Ambire Rewards is introducing new characters to celebrate each new season! Please pick a
            character for Season {CURRENT_SEASON} and continue earning XP for rewards. This
            doesn&#39;t affect your XP count or position on the Leaderboard.
          </Modal.Text>

          <button
            onClick={() => {
              setHasStartedMinting(true)

              setIsOpenNewNftAlert(false)
            }}
            type="button"
            className={styles.button}
          >
            Continue
          </button>
        </div>
      </Modal>

      <CharacterLoadingModal
        isOpen={
          hasStartedMinting &&
          // Currently minting
          (isMinting ||
            // Minted a short time ago and not caught by the relayer
            (isMinted && isCharacterNotMinted))
        }
        loadingMessage={loadingMessage}
        errorMessage={errorMessage}
        showOnMintModal={!!(character && !isCharacterNotMinted && isMinted)}
        onButtonClick={redirectToCharacterPage}
      />
    </Modal>
  )
}

export default CharacterSelect
