// The QR signature scanner is a real camera component (qr-scanner / getUserMedia)
// and is the one genuinely web-specific piece of the QR signing flow. The web
// implementation stays in @web; this resolver lets the shared (common) QR flow
// import a single path.
import QrScannerWithPermission from '@web/modules/hardware-wallet/screens/QrScannerWithPermission'

export default QrScannerWithPermission
