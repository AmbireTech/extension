import SummaryPreview from './SummaryPreview'

// Static import on mobile. Unlike `lazySummaryPreview.web.ts`, we can't lazy load here:
// Metro turns a dynamic `import()` into an async bundle fetch that fails at runtime
// ("Could not load bundle"). Everything is in one bundle, so there is no chunk to warm.
export const preloadSummaryPreview = () => Promise.resolve()

export default SummaryPreview
