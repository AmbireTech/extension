// import Swiper and modules styles
import 'swiper/css'
import 'swiper/css/virtual'
import 'swiper/css/effect-coverflow'
import 'swiper/css/free-mode'

import React, { useRef } from 'react'
import { FreeMode, Mousewheel, Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Alert from '@legends/components/Alert'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import SectionHeading from '@legends/modules/Home/components/SectionHeading'
import Card from '@legends/modules/legends/components/Card'
import { CardStatus } from '@legends/modules/legends/types'

import styles from './Actions.module.scss'

const cardsOrder = [
  'claim-rewards',
  'migrate-stk',
  'staking',
  'buyWalletToken',
  'vote',
  'liquidity'
]

const Actions = () => {
  const { legends, isLoading, error } = useLegendsContext()
  const sliderRef = useRef<any>(null)

  const sortedLegends = React.useMemo(() => {
    if (!legends) return []

    const filtered = legends.filter(
      (card) => card.group === 'supporter' && cardsOrder.includes(card.id)
    )
    return [...filtered].sort((a, b) => {
      // First sort completed cards to the end
      if (a.card.status === CardStatus.completed && b.card.status !== CardStatus.completed) {
        return 1
      }
      if (a.card.status !== CardStatus.completed && b.card.status === CardStatus.completed) {
        return -1
      }

      // Then sort disabled cards after other active cards but before completed ones
      if (
        a.card.status === CardStatus.disabled &&
        b.card.status !== CardStatus.disabled &&
        b.card.status !== CardStatus.completed
      ) {
        return 1
      }
      if (
        a.card.status !== CardStatus.disabled &&
        a.card.status !== CardStatus.completed &&
        b.card.status === CardStatus.disabled
      ) {
        return -1
      }

      // Finally sort by cardsOrder index
      const aIndex = cardsOrder.indexOf(a.id)
      const bIndex = cardsOrder.indexOf(b.id)
      return aIndex - bIndex
    })
  }, [legends])

  // Handler to go to the next character
  const handleNext = () => {
    if (!sliderRef.current) return
    sliderRef.current.swiper.slideNext()
  }

  // Handler to go to the previous character
  const handlePrevious = () => {
    if (!sliderRef.current) return

    sliderRef.current.swiper.slidePrev()
  }

  if (isLoading || !legends) return null

  return (
    <div className={styles.wrapper}>
      <div className={styles.titleAndButtons}>
        <SectionHeading className={styles.title}>Actions</SectionHeading>
        <div className={styles.buttons}>
          <button className={styles.arrowButton} type="button" onClick={handlePrevious}>
            <LeftArrowIcon color="currentColor" />
          </button>
          <button className={styles.arrowButton} type="button" onClick={handleNext}>
            <RightArrowIcon color="currentColor" />
          </button>
        </div>
        {error && <Alert type="error" title={error} className={styles.error} />}
      </div>
      <Swiper
        ref={sliderRef}
        slidesPerView="auto"
        spaceBetween={16}
        navigation
        modules={[FreeMode, Navigation, Mousewheel]}
        scrollbar={{ draggable: true }}
        freeMode={{
          enabled: true,
          momentumVelocityRatio: 0.5,
          momentumRatio: 2
        }}
        mousewheel={{
          enabled: true,
          sensitivity: 10,
          releaseOnEdges: true,
          forceToAxis: true
        }}
      >
        {sortedLegends.map((card) => (
          <SwiperSlide className={`${styles.slide}`} key={card.title + card.card.type}>
            <Card cardData={card} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default Actions
