import React, { useState } from 'react'

import Page from '@legends/components/Page'
import Spinner from '@legends/components/Spinner'
import useLegendsContext from '@legends/hooks/useLegendsContext'
import Card from '@legends/modules/legends/components/Card'
import Topbar from '@legends/modules/legends/components/Topbar'
import { Filter } from '@legends/modules/legends/types'

import styles from './Legends.module.scss'
import { MOCK_FILTERS } from './mockData'

const Legends = () => {
  const [selectedFilter, setSelectedFilter] = useState<Filter['value']>(MOCK_FILTERS[0].value)
  const { legends, isLoading, completedCount } = useLegendsContext()

  const selectFilter = (filter: Filter) => {
    setSelectedFilter(filter.value)
  }

  return (
    <Page>
      <Topbar
        filters={MOCK_FILTERS}
        selectedFilter={selectedFilter}
        selectFilter={selectFilter}
        completedCount={completedCount}
        legendsCount={legends.length}
      />
      {!isLoading ? (
        <div className={styles.cards}>
          {legends.map((card) => (
            <Card
              key={card.title + card.card.type}
              title={card.title}
              description={card.description}
              flavor={card.flavor}
              image={card.image}
              xp={card.xp}
              card={card.card}
              action={card.action}
              meta={card.meta}
              timesCollectedToday={card.timesCollectedToday}
              contentSteps={card.contentSteps}
              contentImage={card.contentImage}
            />
          ))}
        </div>
      ) : (
        <div className={styles.spinnerContainer}>
          <Spinner />
        </div>
      )}
    </Page>
  )
}

export default Legends
