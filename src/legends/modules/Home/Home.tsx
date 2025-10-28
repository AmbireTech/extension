import React, { useEffect, useState } from 'react'

import Page from '@legends/components/Page'
import V1AccountBannerModal from '@legends/components/V1AccountBannerModal/V1AccountBannerModal'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext/useCharacterContext'

import ActivitySection from './components/ActivitySection'
import CharacterSection from './components/CharacterSection'
import FaqSection from './components/FaqSection'
import LandingSection from './components/LandingSection'
import MobileDisclaimerModal from './components/MobileDisclaimerModal'
import QuestsSection from './components/QuestsSection'

const Character = () => {
  const { v1Account, connectedAccount } = useAccountContext()
  const { isCharacterNotMinted } = useCharacterContext()
  const [isModalOpen, setIsModalOpen] = useState(Boolean(v1Account))

  useEffect(() => {
    if (v1Account) {
      setIsModalOpen(true)
    }
  }, [v1Account])

  return (
    <Page containerSize="full">
      {v1Account && (
        <V1AccountBannerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      )}
      {v1Account && !connectedAccount ? (
        <LandingSection nonV2acc />
      ) : connectedAccount ? (
        <CharacterSection />
      ) : (
        <>
          <MobileDisclaimerModal />
          <LandingSection />
        </>
      )}

      <QuestsSection />
      {connectedAccount && !v1Account && <ActivitySection />}

      {(!connectedAccount || !v1Account || isCharacterNotMinted) && <FaqSection />}
    </Page>
  )
}

export default Character
