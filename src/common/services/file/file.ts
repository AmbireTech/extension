import RNFS from 'react-native-fs'

export const getFileContentAsJson = async (uri: string) => {
  let fileContent = await RNFS.readFile(uri, 'utf8')
  fileContent = JSON.parse(fileContent)

  return fileContent
}
