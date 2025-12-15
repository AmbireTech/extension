import React, { useEffect, useState } from 'react'

import Page from '@legends/components/Page'
import V1AccountBannerModal from '@legends/components/V1AccountBannerModal/V1AccountBannerModal'
import useAccountContext from '@legends/hooks/useAccountContext'

import FaqSection from './components/FaqSection'
import LandingSection from './components/LandingSection'
import MobileDisclaimerModal from './components/MobileDisclaimerModal'
import UserDataSection from './components/UserDataSection'

const Home = () => {
  const { v1Account, connectedAccount } = useAccountContext()
  const [isModalOpen, setIsModalOpen] = useState(Boolean(v1Account))

  useEffect(() => {
    if (v1Account) {
      setIsModalOpen(true)
    }
  }, [v1Account])

  if (!connectedAccount) {
    // Separated because the padding of the Page is different when the user is logged in
    return (
      <Page containerSize="responsive">
        {v1Account && (
          <V1AccountBannerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        )}
        <MobileDisclaimerModal />

        <LandingSection nonV2acc={!!v1Account} />
        <FaqSection />
      </Page>
    )
  }

  return <UserDataSection />
}

export default Home
