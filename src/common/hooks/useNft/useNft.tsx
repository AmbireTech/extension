import ERC721ABI from 'ambire-common/contracts/compiled/IERC721.json'
import { Contract } from 'ethers'
import { useEffect, useState } from 'react'

import { getProvider } from '@ambire-common/services/provider'

import fetchCollectible from './helpers/fetchCollectible'
import getUrlWithGateway from './helpers/getUrlWithGateway'
import handleCollectibleUri from './helpers/handleCollectibleUri'
import replaceGateway from './helpers/replaceGateway'
import { CollectibleData } from './types'

interface Props {
  address: string
  networkId: string
  id: bigint
}

interface ReturnInterface {
  data: CollectibleData | null
  error: boolean
  isLoading: boolean
}

interface MaybeUri {
  uri?: string
  err?: string
}

const useNft = ({ address, networkId, id }: Props): ReturnInterface => {
  const [error, setError] = useState(false)
  const [data, setData] = useState<CollectibleData | null>(null)

  useEffect(() => {
    const provider = getProvider(networkId)
    const contract = new Contract(address, ERC721ABI.abi, provider)

    Promise.all([
      contract.ownerOf(id),
      contract
        .tokenURI(id)
        .then((uri: string): MaybeUri => ({ uri }))
        .catch((err: string): MaybeUri => ({ err })),
      contract
        .uri(id)
        .then((uri: string): MaybeUri => ({ uri }))
        .catch((err: string): MaybeUri => ({ err }))
    ]).then(([owner, maybeUri1, maybeUri2]) => {
      // We want to make sure that the url has a gateway. If not, we add ifps.io
      const url = maybeUri1?.uri || maybeUri2?.uri

      if (!url) throw new Error('Failed to fetch collectible')

      const urlWithGateway = getUrlWithGateway(url)

      fetchCollectible(urlWithGateway)
        .then(async (fetchedData: CollectibleData | null) => {
          if (!fetchedData) throw new Error('Failed to fetch collectible')

          setData({ ...fetchedData, image: handleCollectibleUri(fetchedData.image), owner })
        })
        .catch(() => {
          const urlWithDifferentGateway = replaceGateway(urlWithGateway)

          fetchCollectible(urlWithDifferentGateway)
            .then(async (fetchedData: CollectibleData | null) => {
              if (!fetchedData) throw new Error('Failed to fetch collectible')

              setData({ ...fetchedData, image: handleCollectibleUri(fetchedData.image), owner })
            })
            .catch(() => {
              setData({
                owner,
                name: '',
                description: '',
                image: ''
              })
              setError(true)
            })
        })
        .catch(() => setError(true))
    })
  }, [address, id, networkId])

  return { data, error, isLoading: !data && !error }
}

export default useNft
