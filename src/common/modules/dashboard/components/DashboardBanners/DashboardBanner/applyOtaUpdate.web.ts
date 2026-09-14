// No-op on web/extension: Stallion OTA is mobile-only, so the 'apply-ota-update'
// banner action never fires here. This stub exists only so the shared DashboardBanner
// import resolves on web builds.
const applyOtaUpdate = () => {}

export default applyOtaUpdate
