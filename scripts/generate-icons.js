/**
 * Purpose: Generate all required app icon sizes for iOS and Android from source image
 * 
 * Inputs:
 *   - sourceImage: Path to 1024x1024 source PNG (wallet.png)
 * 
 * Outputs:
 *   - Generates icon files for iOS (AppIcon.appiconset)
 *   - Generates icon files for Android (mipmap folders)
 *   - Generates notification icons for both platforms
 * 
 * Side effects:
 *   - Creates/overwrites icon files in iOS and Android directories
 *   - Creates notification icon in assets/icons/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// iOS icon sizes
const iosSizes = [
  { name: 'icon-20.png', size: 20 },
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29.png', size: 29 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40.png', size: 40 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-76@2x.png', size: 152 },
  { name: 'icon-83.5@2x.png', size: 167 },
  { name: 'icon-1024.png', size: 1024 }
];

// Android icon sizes (launcher icons)
const androidSizes = [
  { folder: 'mipmap-mdpi', name: 'ic_launcher.png', size: 48 },
  { folder: 'mipmap-hdpi', name: 'ic_launcher.png', size: 72 },
  { folder: 'mipmap-xhdpi', name: 'ic_launcher.png', size: 96 },
  { folder: 'mipmap-xxhdpi', name: 'ic_launcher.png', size: 144 },
  { folder: 'mipmap-xxxhdpi', name: 'ic_launcher.png', size: 192 }
];

// Android round icons
const androidRoundSizes = [
  { folder: 'mipmap-mdpi', name: 'ic_launcher_round.png', size: 48 },
  { folder: 'mipmap-hdpi', name: 'ic_launcher_round.png', size: 72 },
  { folder: 'mipmap-xhdpi', name: 'ic_launcher_round.png', size: 96 },
  { folder: 'mipmap-xxhdpi', name: 'ic_launcher_round.png', size: 144 },
  { folder: 'mipmap-xxxhdpi', name: 'ic_launcher_round.png', size: 192 }
];

const sourceImage = path.join(__dirname, '..', 'wallet.png');
const iosIconPath = path.join(__dirname, '..', 'ios', 'Wallet', 'Images.xcassets', 'AppIcon.appiconset');
const androidResPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const assetsIconPath = path.join(__dirname, '..', 'assets', 'icons');

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error('❌ Source image not found: wallet.png');
  console.log('Please place a 1024x1024 PNG image named "wallet.png" in the root directory');
  process.exit(1);
}

// Create directories if they don't exist
if (!fs.existsSync(assetsIconPath)) {
  fs.mkdirSync(assetsIconPath, { recursive: true });
}

console.log('🎨 Generating app icons...\n');

// Function to resize image (requires ImageMagick or similar)
function resizeImage(source, output, size, round = false) {
  try {
    // Try using ImageMagick (convert command)
    const roundOption = round ? '-trim +repage -gravity center -crop 1:1 -resize' : '-resize';
    execSync(`magick "${source}" ${roundOption} ${size}x${size} "${output}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    try {
      // Fallback to sips (macOS only)
      execSync(`sips -z ${size} ${size} "${source}" --out "${output}"`, { stdio: 'ignore' });
      return true;
    } catch (sipsError) {
      console.error(`⚠️  Could not resize ${output}`);
      return false;
    }
  }
}

// Generate iOS icons
console.log('📱 Generating iOS icons...');
let iosSuccess = 0;
iosSizes.forEach(({ name, size }) => {
  const outputPath = path.join(iosIconPath, name);
  if (resizeImage(sourceImage, outputPath, size)) {
    console.log(`✓ Created ${name} (${size}x${size})`);
    iosSuccess++;
  }
});

console.log(`\n✅ Generated ${iosSuccess}/${iosSizes.length} iOS icons\n`);

// Generate Android icons
console.log('🤖 Generating Android icons...');
let androidSuccess = 0;

androidSizes.forEach(({ folder, name, size }) => {
  const folderPath = path.join(androidResPath, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  const outputPath = path.join(folderPath, name);
  if (resizeImage(sourceImage, outputPath, size)) {
    console.log(`✓ Created ${folder}/${name} (${size}x${size})`);
    androidSuccess++;
  }
});

androidRoundSizes.forEach(({ folder, name, size }) => {
  const folderPath = path.join(androidResPath, folder);
  const outputPath = path.join(folderPath, name);
  if (resizeImage(sourceImage, outputPath, size, true)) {
    console.log(`✓ Created ${folder}/${name} (${size}x${size} round)`);
    androidSuccess++;
  }
});

console.log(`\n✅ Generated ${androidSuccess}/${androidSizes.length + androidRoundSizes.length} Android icons\n`);

// Generate notification icon (monochrome for Android)
console.log('🔔 Generating notification icon...');
const notificationIcon = path.join(assetsIconPath, 'notification-icon.png');
if (resizeImage(sourceImage, notificationIcon, 96)) {
  console.log('✓ Created notification-icon.png (96x96)\n');
}

console.log('✨ Icon generation complete!\n');
console.log('📝 Next steps:');
console.log('1. Review the generated icons');
console.log('2. For Android notification icon, create a monochrome version');
console.log('3. Test the app on iOS and Android devices');
console.log('4. Build the app for production\n');

// Summary
console.log('📊 Summary:');
console.log(`   iOS icons: ${iosSuccess}/${iosSizes.length}`);
console.log(`   Android icons: ${androidSuccess}/${androidSizes.length + androidRoundSizes.length}`);
console.log(`   Notification icon: ${fs.existsSync(notificationIcon) ? '✓' : '✗'}\n`);
