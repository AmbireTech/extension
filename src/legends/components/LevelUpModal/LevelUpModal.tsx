import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
import { preloadImages } from '@common/utils/images'
import useCharacterContext from '@legends/hooks/useCharacterContext'

import badgeImage from './assets/badge.png'
import cardImage from './assets/card.png'
import styles from './LevelUpModal.module.scss'

const LevelUpModal = () => {
  const { levelUpData, setLevelUpData } = useCharacterContext()
  const [areConfettiPlaying, setAreConfettiPlaying] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Load the modal in the dom but don't show it immediately
  // This is done to preload all images
  useEffect(() => {
    if (!levelUpData) return

    preloadImages([
      badgeImage,
      cardImage,
      levelUpData.oldCharacterImage,
      levelUpData.newCharacterImage
    ])
    const timeout = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [levelUpData])

  // Don't play confetti immediately after level up
  useEffect(() => {
    if (!levelUpData || !isVisible) return

    const timeout = setTimeout(
      () => {
        setAreConfettiPlaying(true)
      },
      // In case of evolution, play confetti after swapping the character image
      // Otherwise, play confetti after swapping the levels
      levelUpData.didEvolve ? 1000 : 500
    )

    return () => clearTimeout(timeout)
  }, [isVisible, levelUpData])

  const handleClose = () => {
    setAreConfettiPlaying(false)
    setIsVisible(false)

    // Wait for the animation to finish before closing the modal
    setTimeout(() => {
      setLevelUpData(null)
    }, 500)
  }

  if (!levelUpData) return null

  const { oldCharacterImage, newCharacterImage, didEvolve, newLevel } = levelUpData

  return createPortal(
    <div className={`${styles.backdrop} ${isVisible ? styles.visible : ''}`}>
      {areConfettiPlaying && (
        <ConfettiAnimation width={730} height={584} type="secondary" className={styles.confetti} />
      )}
      <div className={styles.modal}>
        <h2 className={styles.title}>You’ve Reached Level {newLevel}!</h2>
        <div
          className={`${styles.card} ${didEvolve ? styles.evolution : ''}`}
          style={{
            backgroundImage: `url(${cardImage})`
          }}
        >
          <img
            className={`${styles.characterImage} ${styles.oldCharacterImage}`}
            src={oldCharacterImage}
            alt="" // No alt on purpose
          />
          {didEvolve && (
            <img
              className={`${styles.characterImage} ${styles.newCharacterImage}`}
              src={newCharacterImage}
              alt="" // No alt on purpose
            />
          )}

          <div
            className={styles.badge}
            style={{
              backgroundImage: `url(${badgeImage})`
            }}
          >
            <div className={styles.badgeLevels}>
              <div className={styles.badgeLevelsInner}>
                <p className={styles.level}>{levelUpData.oldLevel}</p>
                <p className={styles.level}>{levelUpData.newLevel}</p>
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleClose} type="button" className={styles.button}>
          Keep Rising
        </button>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  )
}

export default LevelUpModal
