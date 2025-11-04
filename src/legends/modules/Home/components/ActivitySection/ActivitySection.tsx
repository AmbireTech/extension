import React from 'react'

import { networks } from '@ambire-common/consts/networks'
import LinkIcon from '@common/assets/svg/LinkIcon'
import spacings from '@common/styles/spacings'
import Alert from '@legends/components/Alert'
import { NetworkIcon } from '@legends/components/NetworkIcons'
import Spinner from '@legends/components/Spinner'
import useActivityContext from '@legends/hooks/useActivityContext'
import { Networks } from '@legends/modules/legends/types'

import SectionHeading from '../SectionHeading'
import styles from './ActivitySection.module.scss'
import Pagination from './Pagination'

const ActivitySection = () => {
  const { activity, isLoading, error, setPage, currentPage } = useActivityContext()
  const { transactions } = activity || {}

  return (
    <div className={styles.wrapper}>
      <SectionHeading>Your Current Season Activity</SectionHeading>
      {isLoading && (
        <div className={styles.spinnerWrapper}>
          <Spinner />
        </div>
      )}
      {error && <Alert type="error" title={error} />}
      {!isLoading && transactions?.length ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Network</th>
              <th>Total XP</th>
              <th>Quests</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(
              ({ chainId, legends, submittedAt, userOpHash, txId, network: txNetwork }) => {
                const network = networks.find(
                  ({ chainId: nChainId }) => chainId.toString() === nChainId.toString()
                )

                return (
                  <tr key={txId + submittedAt}>
                    <td>
                      <div className={styles.linksWrapper}>
                        {new Date(submittedAt).toLocaleString([], {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}

                        {!!network && (
                          <>
                            <a
                              href={`https://explorer.ambire.com/?chainId=${
                                network.chainId
                              }&txnId=${txId}${userOpHash ? `&userOpHash=${userOpHash}` : ''}`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.link}
                            >
                              View transaction
                              <LinkIcon style={spacings.phTy} />
                            </a>
                            <a
                              href={`${network.explorerUrl}/tx/${txId}`}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.link}
                            >
                              View in block explorer
                              <LinkIcon style={spacings.phTy} />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <NetworkIcon chainId={chainId.toString() as Networks} />
                      <span className={styles.network}>{network?.name || txNetwork}</span>
                    </td>
                    <td>
                      <span className={styles.xp}>{legends.totalXp}</span>
                    </td>
                    <td className={styles.legendsWrapper}>
                      {legends.activities?.map((legendActivity, i) => (
                        <div
                          className={styles.badge}
                          // eslint-disable-next-line react/no-array-index-key
                          key={legendActivity.action + legendActivity.xp + i}
                        >
                          {legendActivity.labelText} (+{legendActivity.xp} XP)
                        </div>
                      ))}
                    </td>
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      ) : null}
      {!transactions?.length && !isLoading && !error && <p>No activity found for this account</p>}
      {activity ? <Pagination activity={activity} page={currentPage} setPage={setPage} /> : null}
    </div>
  )
}

export default React.memo(ActivitySection)
