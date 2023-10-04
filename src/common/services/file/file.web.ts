export const getFileContentAsJson = async (uri: string) => {
  let fileContent = await fetch(uri, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  })

  fileContent = await fileContent.json()

  return fileContent
}
