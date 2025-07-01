import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants'

import blurredLights from './blurred-lights-wide.png'
import styles from './CharacterSelect.module.scss'
import CharacterLoadingModal from './components/CharacterLoadingModal'
import CharacterSlider from './components/CharacterSlider'
import useMintCharacter from './hooks/useMintCharacter'

const CharacterSelect = () => {
  const navigate = useNavigate()
  const [characterId, setCharacterId] = useState(1)
  const { connectedAccount, v1Account } = useAccountContext()
  const [errorMessage, setErrorMessage] = useState('')
  const [hasStartedMinting, setHasStartedMinting] = useState(false)

  const { character, isLoading } = useCharacterContext()
  const { isMinting, isMinted, loadingMessage, isCheckingMintStatus, mintCharacter } =
    useMintCharacter()

  useEffect(() => {
    if (isMinted) navigate(LEGENDS_ROUTES.home)
  }, [character, isMinted, connectedAccount, isLoading, isMinting, navigate])

  const onCharacterChange = (id: number) => {
    setCharacterId(id)
  }

  const redirectToCharacterPage = () => {
    navigate(LEGENDS_ROUTES.home)
  }

  useEffect(() => {
    document.title = 'Ambire Rewards'
  }, [])

  if (!!v1Account || !connectedAccount) {
    return <Navigate to="/" />
  }

  const isButtonDisabled = isMinting || isLoading || isMinted

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.backgroundEffect}
        style={{ backgroundImage: `url(${blurredLights})` }}
      />
      <div>
        <h1 className={styles.title}>Mint Your NFT</h1>
        <p className={styles.description}>
          Pick your profile avatar and mint a soulbound NFT for free
        </p>
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
          {isMinting ? 'Please wait...' : 'Mint NFT'}
        </button>
      )}
      {isCheckingMintStatus && <Spinner />}
      </div>

      <CharacterLoadingModal
        isOpen={
          hasStartedMinting &&
          // Currently minting
          (isMinting ||
            // Minted a short time ago and not caught by the relayer
            (isMinted && !character))
        }
        loadingMessage={loadingMessage}
        errorMessage={errorMessage}
        showOnMintModal={!!(character || (character && isMinted))}
        onButtonClick={redirectToCharacterPage}
      />
    </div>
  )
}

export default CharacterSelect
