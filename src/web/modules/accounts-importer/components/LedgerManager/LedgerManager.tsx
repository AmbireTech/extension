import React from 'react'

import AccountsList from '@web/modules/accounts-importer/components/AccountsList'
import { HARDWARE_WALLETS } from '@web/modules/hardware-wallet/constants/common'
import useHardwareWallets from '@web/modules/hardware-wallet/hooks/useHardwareWallets'
import useTaskQueue from '@web/modules/hardware-wallet/hooks/useTaskQueue'

const MAX_ACCOUNT_COUNT = 10

const startNo = 1

interface Props {}

const LedgerManager: React.FC<Props> = ({ type = 'Ledger Live', ...props }) => {
  const [accountList, setAccountList] = React.useState<any[]>([])

  const [loading, setLoading] = React.useState(true)
  const stoppedRef = React.useRef(true)
  const startNoRef = React.useRef(startNo)
  const typeRef = React.useRef(type)
  const exitRef = React.useRef(false)
  const { createTask } = useTaskQueue()
  const { hardwareWallets } = useHardwareWallets()

  const asyncGetAccounts = React.useCallback(async () => {
    stoppedRef.current = false
    setLoading(true)
    const start = startNoRef.current
    const index = start - 1
    let i = index
    const isLedgerLive = true

    try {
      await createTask(() => hardwareWallets[HARDWARE_WALLETS.LEDGER].unlock())
      for (i = index; i < index + MAX_ACCOUNT_COUNT; ) {
        if (exitRef.current) {
          return
        }

        if (stoppedRef.current) {
          break
        }
        // eslint-disable-next-line no-await-in-loop, @typescript-eslint/no-loop-func
        const accounts = (await createTask(() =>
          hardwareWallets[HARDWARE_WALLETS.LEDGER].getAddresses(i, i + 1)
        )) as any[]
        setAccountList((prev) => [...prev, ...accounts])
        setLoading(false)

        // only ledger live need to fetch one by one
        if (isLedgerLive) {
          i++
        } else {
          i += 5
        }
      }
    } catch (e) {
      console.error(e.message)
      return
    }
    stoppedRef.current = true
    // maybe stop by manual, so we need restart
    if (i !== index + MAX_ACCOUNT_COUNT) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      runGetAccounts()
    }
  }, [createTask, hardwareWallets, runGetAccounts])

  const runGetAccounts = React.useCallback(async () => {
    setAccountList([])
    asyncGetAccounts()
  }, [asyncGetAccounts])

  React.useEffect(() => {
    typeRef.current = type
    startNoRef.current = startNo

    if (type) {
      if (stoppedRef.current) {
        runGetAccounts()
      } else {
        stoppedRef.current = true
      }
    }
  }, [type, runGetAccounts])

  React.useEffect(() => {
    return () => {
      exitRef.current = true
    }
  }, [])

  const fullData = React.useMemo(() => {
    const newData = [...(accountList ?? [])]
    let lastIndex = newData[newData.length - 1]?.index ?? 0

    for (let i = newData.length; i < MAX_ACCOUNT_COUNT; i++) {
      newData.push({
        address: '',
        index: ++lastIndex
      })
    }
    return newData
  }, [accountList])

  return <AccountsList accounts={fullData} loading={loading} {...props} />
}

export default LedgerManager
