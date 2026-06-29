// Keystone (QR) hardware-wallet signing is on the mobile roadmap but not yet
// implemented, so the camera-based scanner has no mobile implementation. This
// stub keeps the shared QR signing flow importable from common; it is never
// rendered on mobile today because a QR/Keystone key cannot be imported there.
// TODO(keystone-mobile): replace with an expo-camera based scanner.
const QrScannerWithPermission = () => null

export default QrScannerWithPermission
