import React from 'react'

import Page from '@legends/components/Page'
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

  return (
    <Page containerSize="full">
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
      {connectedAccount && !v1Account && !isCharacterNotMinted && <ActivitySection />}

      {(!connectedAccount || !v1Account || isCharacterNotMinted) && <FaqSection />}
    </Page>
  )
}

export default Character
