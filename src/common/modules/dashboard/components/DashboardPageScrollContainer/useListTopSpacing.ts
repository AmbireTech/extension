import spacings from '@common/styles/spacings'

// The carousel renders the banners above the pages instead of inside them, so
// subscribing to them here would only cost every page a re-render whenever any
// of the controllers behind the banners emits an update.
const useListTopSpacing = () => spacings.pt0

export default useListTopSpacing
