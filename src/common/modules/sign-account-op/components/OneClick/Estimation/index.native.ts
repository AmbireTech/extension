import OneClickEstimation from './Estimation'

// Static import on mobile. Unlike `index.web.ts`, we can't lazy load here: Metro
// turns a dynamic `import()` into an async bundle fetch that fails at runtime
// ("Could not load bundle").
export default OneClickEstimation
