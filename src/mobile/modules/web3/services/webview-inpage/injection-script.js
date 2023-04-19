import RNFS from 'react-native-fs'

import { useEffect, useState } from 'react'

const interval = 1000

const useGetProviderInjection = () => {
  const [provider, setProvider] = useState('')

  const filePath = `${RNFS.MainBundlePath}/EthereumProvider.js`

  useEffect(() => {
    RNFS.readDir(RNFS.MainBundlePath).then((res) => {
      console.log('res', res)
    })

    let intervalId
    let prevModifiedTime

    const readAndSetProvider = () => {
      RNFS.stat(filePath)
        .then((stats) => {
          const modifiedTime = stats.mtimeMs

          if (modifiedTime !== prevModifiedTime) {
            prevModifiedTime = modifiedTime

            RNFS.readFile(filePath, 'utf8')
              .then((newContents) => {
                console.log(`Reloaded ${filePath}`)
                setProvider(newContents)
              })
              .catch((error) => {
                console.error(`Error reloading ${filePath}:`, error)
              })
          }
        })
        .catch((error) => {
          console.error(`Error checking modification time of ${filePath}:`, error)
        })
    }

    RNFS.readFile(filePath, 'utf8')
      .then((initialContents) => {
        setProvider(initialContents)
        // console.log(`Initial contents of ${filePath}:`, initialContents)

        // Periodically check the modification time of the file and reload it if it has changed
        intervalId = setInterval(readAndSetProvider, interval)
      })
      .catch((error) => {
        console.error(`Error reading initial contents of ${filePath}:`, error)
      })

    return () => {
      clearInterval(intervalId)
    }
  }, [filePath, provider])

  return provider
}

export default useGetProviderInjection
