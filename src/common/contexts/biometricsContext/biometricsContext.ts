// Editor/type-check fallback for environments that do not apply
// React Native platform resolution (`.web` / `.native`) at this import site.
// Real builds should resolve through `index.web.ts` / `index.native.ts`.
export * from './biometricsContext.web'
