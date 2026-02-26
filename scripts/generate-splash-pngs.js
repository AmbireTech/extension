#!/usr/bin/env node
/**
 * Generate splash screen PNGs from SVG for iOS and Android.
 *
 * iOS: Full logo with text (icon + "AMBIRE"), 120pt
 * Android: Full logo with text, smaller (~80dp), uses legacy windowBackground approach
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const SVG_PATH = path.join(PROJECT_ROOT, 'src/mobile/assets/svg/splash-screen-logo.svg')
const TMP_DIR = path.join(PROJECT_ROOT, '.expo', '_splash_tmp')

// Read original SVG (viewBox 0 0 80 100: icon is 80x80, text below)
const originalSvg = fs.readFileSync(SVG_PATH, 'utf8')

// Light theme: change AMBIRE text fill from "white" to "#1B1D20"
const lightSvg = originalSvg.replace(
  /(<path fill-rule="evenodd" clip-rule="evenodd" d="M14\.0395.*?" fill=")white("\/\>)/s,
  '$1#1B1D20$2'
)

// Dark theme: keep original white text
const darkSvg = originalSvg

// iOS: 120pt base
const IOS_IMAGE_WIDTH = 80
const IOS_SIZES = [
  { name: 'image.png', width: IOS_IMAGE_WIDTH },
  { name: 'image@2x.png', width: IOS_IMAGE_WIDTH * 2 },
  { name: 'image@3x.png', width: IOS_IMAGE_WIDTH * 3 }
]

// Android: icon-only (no text) since Android 12+ clips to circle
// Safe area within the circle is ~72dp, use 64dp for padding
const ANDROID_ICON_SIZE_DP = 48
const ANDROID_DENSITIES = [
  { density: 'mdpi', mult: 1 },
  { density: 'hdpi', mult: 1.5 },
  { density: 'xhdpi', mult: 2 },
  { density: 'xxhdpi', mult: 3 },
  { density: 'xxxhdpi', mult: 4 }
]

const IOS_IMAGESET = path.join(PROJECT_ROOT, 'ios/Ambire/Images.xcassets/SplashScreenLogo.imageset')
const ANDROID_RES = path.join(PROJECT_ROOT, 'android/app/src/main/res')

// Android icon-only SVG: crop viewBox to 80x80 (just the icon, no text)
const androidIconSvg = originalSvg
  .replace('viewBox="0 0 80 100"', 'viewBox="0 0 80 80"')
  .replace('height="100"', 'height="80"')
  .replace(/<path fill-rule="evenodd" clip-rule="evenodd" d="M14\.0395.*?"\/\>/s, '')

function convertSvgToPng(svgContent, outputPath, width, height) {
  const tmpSvg = path.join(TMP_DIR, `splash_${width}_${height}.svg`)
  fs.writeFileSync(tmpSvg, svgContent)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })

  execSync(
    `npx -y sharp-cli -i "${tmpSvg}" -o "${outputPath}" -- resize ${width} ${height} --fit contain --background "transparent"`,
    { cwd: PROJECT_ROOT, stdio: 'pipe' }
  )

  console.log(`  ✓ ${path.relative(PROJECT_ROOT, outputPath)} (${width}x${height})`)
  try {
    fs.unlinkSync(tmpSvg)
  } catch {}
}

function main() {
  console.log('Generating splash screen PNGs...\n')
  fs.mkdirSync(TMP_DIR, { recursive: true })

  // SVG aspect ratio: 80:100 = 0.8:1
  const aspectRatio = 100 / 80

  // === iOS === (full logo with text)
  console.log('iOS (SplashScreenLogo.imageset):')
  fs.mkdirSync(IOS_IMAGESET, { recursive: true })

  for (const { name, width } of IOS_SIZES) {
    const height = Math.round(width * aspectRatio)
    convertSvgToPng(lightSvg, path.join(IOS_IMAGESET, name), width, height)
  }
  for (const { name, width } of IOS_SIZES) {
    const darkName = name.replace('image', 'dark_image')
    const height = Math.round(width * aspectRatio)
    convertSvgToPng(darkSvg, path.join(IOS_IMAGESET, darkName), width, height)
  }

  // === Android === (icon-only, square, for circular mask)
  console.log('\nAndroid Light (drawable-*):')
  for (const { density, mult } of ANDROID_DENSITIES) {
    const size = Math.round(ANDROID_ICON_SIZE_DP * mult)
    convertSvgToPng(
      androidIconSvg,
      path.join(ANDROID_RES, `drawable-${density}`, 'splashscreen_logo.png'),
      size,
      size
    )
  }

  console.log('\nAndroid Dark (drawable-night-*):')
  for (const { density, mult } of ANDROID_DENSITIES) {
    const size = Math.round(ANDROID_ICON_SIZE_DP * mult)
    convertSvgToPng(
      androidIconSvg,
      path.join(ANDROID_RES, `drawable-night-${density}`, 'splashscreen_logo.png'),
      size,
      size
    )
  }

  // Copy 1x iOS to assets/ for config plugin
  fs.mkdirSync(path.join(PROJECT_ROOT, 'assets'), { recursive: true })
  fs.copyFileSync(
    path.join(IOS_IMAGESET, 'image.png'),
    path.join(PROJECT_ROOT, 'assets', 'splash-icon.png')
  )
  fs.copyFileSync(
    path.join(IOS_IMAGESET, 'dark_image.png'),
    path.join(PROJECT_ROOT, 'assets', 'splash-icon-dark.png')
  )

  // Cleanup
  fs.rmSync(TMP_DIR, { recursive: true, force: true })

  console.log('\n✅ All splash screen PNGs generated!')
  console.log(`   iOS: ${IOS_IMAGE_WIDTH}pt (full logo with text)`)
  console.log(`   Android: ${ANDROID_ICON_SIZE_DP}dp (icon-only, for circular mask)`)
}

main()
