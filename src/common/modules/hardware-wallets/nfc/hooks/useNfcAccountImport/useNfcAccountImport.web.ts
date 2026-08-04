/**
 * Reading NFC cards needs a native radio, so there is nothing to import from on
 * web. The options that start the flow are only rendered on mobile.
 */
const scanCard = () => {}

const useNfcAccountImport = () => ({ scanCard })

export default useNfcAccountImport
