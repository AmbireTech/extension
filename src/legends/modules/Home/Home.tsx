import React, { useEffect, useState } from 'react'

import Page from '@legends/components/Page'
import V1AccountBannerModal from '@legends/components/V1AccountBannerModal/V1AccountBannerModal'
import useAccountContext from '@legends/hooks/useAccountContext'

import FaqSection from './components/FaqSection'
import LandingSection from './components/LandingSection'
import MobileDisclaimerModal from './components/MobileDisclaimerModal'
import UserDataSection from './components/UserDataSection'

const Character = () => {
  const { v1Account, connectedAccount } = useAccountContext()
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
      {!connectedAccount ? (
        <>
          <LandingSection nonV2acc={!!v1Account} />
          <MobileDisclaimerModal />
        </>
      ) : (
        <UserDataSection />
      )}

      {(!connectedAccount || !v1Account) && <FaqSection />}
    </Page>
  )
}

export default Character
