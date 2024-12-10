import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { RELAYER_URL } from '@env'
import LevelUpModal from '@legends/components/LevelUpModal'
import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'

type Character = {
  characterType: 'unknown' | 'slime' | 'sorceress' | 'necromancer' | 'penguin'
  characterName: string
  name: string
  description: string
  level: number
  xp: number
  image: string
  image_avatar: string
  image_fixed: string
  address: string
}

type LevelUpData = {
  oldLevel: number
  newLevel: number
  oldCharacterImage: string
  newCharacterImage: string
  didEvolve: boolean
} | null

type CharacterContextValue = {
  character: Character | null
  getCharacter: () => Promise<void>
  isLoading: boolean
  error: string | null
  levelUpData: LevelUpData
  setLevelUpData: React.Dispatch<React.SetStateAction<LevelUpData>>
}

const CharacterContext = createContext<CharacterContextValue>({} as CharacterContextValue)

const CharacterContextProvider: React.FC<any> = ({ children }) => {
  const { connectedAccount } = useAccountContext()
  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [levelUpData, setLevelUpData] = useState<LevelUpData>(null)
  // In case of this error, a global <ErrorPage /> will be rendered in place of all other components,
  // as loading a character is crucial for playing in Legends.
  const [error, setError] = useState<string | null>(null)

  const handleLevelUpIfNeeded = useCallback(
    (newCharacter: Character, oldCharacter: Character | null) => {
      if (!oldCharacter) {
        setLevelUpData(null)
        return
      }

      const didAccountChange = newCharacter.address !== oldCharacter.address
      const didLevelUp = newCharacter.level > oldCharacter.level

      if (!didLevelUp || didAccountChange) {
        setLevelUpData(null)
        return
      }

      const didEvolve = oldCharacter.image_fixed !== newCharacter.image_fixed

      setLevelUpData({
        oldLevel: oldCharacter.level,
        oldCharacterImage: oldCharacter.image_fixed,
        newCharacterImage: newCharacter.image_fixed,
        newLevel: newCharacter.level,
        didEvolve
      })
    },
    []
  )

  const getCharacter = useCallback(async () => {
    setLevelUpData(null)

    if (!connectedAccount) {
      setCharacter(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const characterResponse = await fetch(`${RELAYER_URL}/legends/nft-meta/${connectedAccount}`)

      const characterJson = await characterResponse.json()

      if (characterJson.characterType === 'unknown') {
        setIsLoading(false)
        setCharacter(null)
        return
      }

      const newCharacter = {
        ...characterJson,
        address: connectedAccount
      } as Character

      handleLevelUpIfNeeded(newCharacter, character)

      setCharacter(newCharacter)
      setError(null)
    } catch (e) {
      console.error(e)

      throw e
    } finally {
      setIsLoading(false)
    }
  }, [character, connectedAccount, handleLevelUpIfNeeded])

  useEffect(() => {
    if (character && character.address === connectedAccount) return

    getCharacter().catch(() => {
      setError(`Couldn't load the requested character: ${connectedAccount}`)
    })
  }, [character, connectedAccount, getCharacter])

  const contextValue = useMemo(
    () => ({
      character,
      getCharacter,
      isLoading,
      error,
      levelUpData,
      setLevelUpData
    }),
    [character, getCharacter, isLoading, error, levelUpData]
  )

  // Important: Short-circuit evaluation to prevent loading of child contexts/components
  // in the case character's address mismatches the currently connected account.
  // We should only load child contexts if the character's address matches the connected account.
  // How can this mismatch occur?
  // If we're connected to a v2 account, `character.address` and `connectedAccounts` should match.
  // However, when switching to another v2 account without a character, there may be a brief delay as the new character is fetched.
  // During this delay, child contexts could try to operate with the new `connectedAccount` but the previous `character`, which is incorrect.
  // This validation ensures `connectedAccount` and `character` are always in sync.
  if (character && character.address !== connectedAccount) return <Spinner isCentered />

  return (
    <CharacterContext.Provider value={contextValue}>
      <LevelUpModal />
      {children}
    </CharacterContext.Provider>
  )
}

export { CharacterContextProvider, CharacterContext }
