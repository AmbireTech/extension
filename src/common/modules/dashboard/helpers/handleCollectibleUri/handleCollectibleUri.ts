const handleCollectibleUri = (uri: string) => {
  if (!uri) return ''
  // eslint-disable-next-line no-param-reassign
  uri = uri.startsWith('data:application/json')
    ? uri.replace('data:application/json;utf8,', '')
    : uri

  if (uri.split('/').length === 1) return `https://ipfs.io/ipfs/${uri}`
  if (uri.split('/')[0] === 'data:image') return uri
  if (uri.startsWith('ipfs://'))
    return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
  if (uri.split('/')[2].endsWith('mypinata.cloud'))
    return `https://ipfs.io/ipfs/${uri.split('/').slice(4).join('/')}`

  return uri
}

export default handleCollectibleUri
