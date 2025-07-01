import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { RELAYER_URL } from '@env'
import LevelUpModal from '@legends/components/LevelUpModal'
import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'
import { CURRENT_SEASON } from '@legends/modules/legends/constants'
import { getDidEvolve } from '@legends/utils/character'

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
  const { connectedAccount, isLoading: isConnectedAccountLoading } = useAccountContext()
  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [levelUpData, setLevelUpData] = useState<LevelUpData>(null)
  const [lastKnownLevels, setLastKnownLevels] = useState<{ [address: string]: number }>(() => {
    const storageValue = localStorage.getItem('lastKnownLevels')

    return storageValue ? JSON.parse(storageValue) : {}
  })
  // In case of this error, a global <ErrorPage /> will be rendered in place of all other components,
  // as loading a character is crucial for playing in Legends.
  const [error, setError] = useState<string | null>(null)

  const saveLastKnownLevel = useCallback(
    (address: string, level: number) => {
      const newLastKnownLevels = {
        ...lastKnownLevels,
        [address]: level
      }

      setLastKnownLevels(newLastKnownLevels)
      localStorage.setItem('lastKnownLevels', JSON.stringify(newLastKnownLevels))
    },
    [lastKnownLevels]
  )

  const handleLevelUpIfNeeded = useCallback(
    (newCharacter: Character, oldCharacter: Character | null) => {
      // Leveled up from actions, outside of Legends
      // E.g. Swap
      if (!oldCharacter) {
        const lastKnownLevel = lastKnownLevels[newCharacter.address]

        if (!lastKnownLevel || newCharacter.level <= lastKnownLevel) {
          setLevelUpData(null)
          return
        }

        setLevelUpData({
          oldLevel: lastKnownLevel,
          oldCharacterImage: newCharacter.image_fixed,
          newCharacterImage: newCharacter.image_fixed,
          newLevel: newCharacter.level,
          didEvolve: getDidEvolve(lastKnownLevel, newCharacter.level)
        })
        return
      }

      // Leveled up from in-game actions. E.g. Wheel of Fortune
      const didAccountChange = newCharacter.address !== oldCharacter.address
      const didLevelUp = newCharacter.level > oldCharacter.level

      if (!didLevelUp || didAccountChange) {
        setLevelUpData(null)
        return
      }

      setLevelUpData({
        oldLevel: oldCharacter.level,
        oldCharacterImage: oldCharacter.image_fixed,
        newCharacterImage: newCharacter.image_fixed,
        newLevel: newCharacter.level,
        didEvolve: getDidEvolve(oldCharacter.level, newCharacter.level)
      })
    },
    [lastKnownLevels]
  )

  const getCharacter = useCallback(async () => {
    if (!connectedAccount) {
      setCharacter(null)
      setIsLoading(true)
      return
    }

    setLevelUpData(null)

    try {
      setIsLoading(true)
      const characterResponse = await fetch(
        `${RELAYER_URL}/legends/nft-meta/${connectedAccount}/${CURRENT_SEASON}`
      )
      const characterJson = await characterResponse.json()

      if (characterJson.characterType === 'unknown') {
        setIsLoading(false)
        setCharacter(null)
        return
      }

      const newCharacter = {
        ...characterJson,
        level: characterJson.level,
        address: connectedAccount
      } as Character

      saveLastKnownLevel(newCharacter.address, newCharacter.level)
      handleLevelUpIfNeeded(newCharacter, character)

      setCharacter(newCharacter)
      setError(null)
    } catch (e) {
      console.error(e)

      throw e
    } finally {
      setIsLoading(false)
    }
  }, [character, connectedAccount, handleLevelUpIfNeeded, saveLastKnownLevel])

  useEffect(() => {
    if ((character && character.address === connectedAccount) || isConnectedAccountLoading) return

    getCharacter().catch(() => {
      setError(`Couldn't load the requested character: ${connectedAccount}`)
    })
  }, [character, connectedAccount, getCharacter, isConnectedAccountLoading])

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
  if (character && character.address !== connectedAccount && connectedAccount !== null)
    return <Spinner isCentered />

  return (
    <CharacterContext.Provider value={contextValue}>
      <LevelUpModal />
      {children}
    </CharacterContext.Provider>
  )
}

export { CharacterContextProvider, CharacterContext }
