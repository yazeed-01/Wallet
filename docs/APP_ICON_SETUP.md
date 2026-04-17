# App Icon & Splash Screen Setup

## Overview

This document explains how to set up app icons and splash screens for both iOS and Android platforms.

## Prerequisites

- **ImageMagick**: Required for icon generation
  - **Windows**: `choco install imagemagick` or download from https://imagemagick.org/
  - **macOS**: `brew install imagemagick`
  - **Linux**: `sudo apt-get install imagemagick`

## Source Files

- **App Icon Source**: `wallet.png` (1024x1024 PNG)
- Place this file in the project root directory

## Generating Icons

### Automatic Generation

Run the following command to generate all icon sizes automatically:

```bash
yarn generate:icons
```

This will create:
- **iOS Icons**: 15 different sizes for iPhone, iPad, and App Store
- **Android Icons**: Standard and round icons for all densities (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- **Notification Icon**: 96x96 icon for push notifications

### Manual Generation (if needed)

If the automatic script fails, you can manually resize the icons using ImageMagick:

```bash
# iOS example - generate 60@3x (180x180)
magick wallet.png -resize 180x180 ios/Wallet/Images.xcassets/AppIcon.appiconset/icon-60@3x.png

# Android example - generate xxxhdpi (192x192)
magick wallet.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

## Icon Sizes Reference

### iOS Icon Sizes

| Size | Usage | Filename | Dimensions |
|------|-------|----------|------------|
| 20pt | iPhone Notification | icon-20@2x.png, icon-20@3x.png | 40x40, 60x60 |
| 29pt | iPhone Settings | icon-29@2x.png, icon-29@3x.png | 58x58, 87x87 |
| 40pt | iPhone Spotlight | icon-40@2x.png, icon-40@3x.png | 80x80, 120x120 |
| 60pt | iPhone App | icon-60@2x.png, icon-60@3x.png | 120x120, 180x180 |
| 76pt | iPad App | icon-76.png, icon-76@2x.png | 76x76, 152x152 |
| 83.5pt | iPad Pro App | icon-83.5@2x.png | 167x167 |
| 1024pt | App Store | icon-1024.png | 1024x1024 |

### Android Icon Sizes

| Density | ic_launcher.png | ic_launcher_round.png |
|---------|----------------|----------------------|
| mdpi | 48x48 | 48x48 |
| hdpi | 72x72 | 72x72 |
| xhdpi | 96x96 | 96x96 |
| xxhdpi | 144x144 | 144x144 |
| xxxhdpi | 192x192 | 192x192 |

## Splash Screen Configuration

### iOS Splash Screen

The splash screen is configured in [LaunchScreen.storyboard](../ios/Wallet/LaunchScreen.storyboard):
- Displays centered app icon (200x200)
- Background color: `#0066FF` (primary blue)
- Automatically handled by React Native

### Android Splash Screen

The splash screen is configured in XML resources:
- **Layout**: [android/app/src/main/res/drawable/splash_screen.xml](../android/app/src/main/res/drawable/splash_screen.xml)
- **Colors**: [android/app/src/main/res/values/colors.xml](../android/app/src/main/res/values/colors.xml)
- Background color: `#0066FF` (primary blue)
- Displays centered launcher icon

### Custom React Native Splash Screen

A custom animated splash screen component is available at:
- [src/components/common/SplashScreen.tsx](../src/components/common/SplashScreen.tsx)

This component provides:
- Animated logo appearance (scale + fade in)
- Minimum display time (1 second)
- Smooth fade out transition
- Callback for initialization completion

## App Configuration

The app metadata is configured in [app.json](../app.json):

```json
{
  "expo": {
    "name": "Wallet",
    "icon": "./wallet.png",
    "splash": {
      "image": "./wallet.png",
      "backgroundColor": "#0066FF"
    }
  }
}
```

## Testing

### iOS Testing

1. Clean build folder:
   ```bash
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   ```

2. Run on simulator:
   ```bash
   yarn ios
   ```

3. Check:
   - Home screen icon appears correctly
   - Launch screen displays centered logo
   - No blank screens during launch

### Android Testing

1. Clean build:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. Run on emulator/device:
   ```bash
   yarn android
   ```

3. Check:
   - Home screen icon appears correctly (both round and square variants)
   - Splash screen displays before app loads
   - Colors match brand guidelines

## Troubleshooting

### Icons not updating on iOS

```bash
# Clean DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData
# Rebuild
yarn ios
```

### Icons not updating on Android

```bash
# Uninstall app first
adb uninstall com.wallet.app
# Clean and rebuild
cd android && ./gradlew clean && cd ..
yarn android
```

### ImageMagick not found

Make sure ImageMagick is installed and in your PATH:

```bash
# Test if ImageMagick is installed
magick --version

# If not found, install it:
# macOS: brew install imagemagick
# Windows: choco install imagemagick
```

## Design Guidelines

### Icon Design Best Practices

- **Simple & Recognizable**: Keep the design simple and easily identifiable
- **No Transparency**: iOS requires opaque icons (use solid background)
- **Consistent Brand Colors**: Use your brand colors (#0066FF for Wallet app)
- **Test at Small Sizes**: Ensure icon is recognizable at 20x20pt
- **Rounded Corners**: iOS automatically applies rounded corners; don't pre-round
- **Safe Area**: Keep important content within center 80% (Android adaptive icons)

### Splash Screen Best Practices

- **Fast Loading**: Keep splash screen simple for quick load times
- **Brand Consistency**: Match app icon and splash screen design
- **No Text**: Avoid text in splash screen (hard to localize)
- **Center Logo**: Keep important content centered for different screen sizes
- **Solid Background**: Use solid color matching your brand

## Resources

- [Apple Human Interface Guidelines - App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Icon Design Guidelines](https://developer.android.com/distribute/google-play/resources/icon-design-specifications)
- [React Native App Icon Setup](https://reactnative.dev/docs/signed-apk-android#setting-up-gradle-variables)

## File Structure

```
Wallet/
├── wallet.png                              # Source icon (1024x1024)
├── app.json                                # App configuration
├── scripts/
│   └── generate-icons.js                  # Icon generation script
├── ios/
│   └── Wallet/
│       ├── LaunchScreen.storyboard        # iOS splash screen
│       └── Images.xcassets/
│           └── AppIcon.appiconset/        # iOS icons
│               ├── Contents.json
│               ├── icon-20@2x.png
│               ├── icon-20@3x.png
│               ├── ... (15 total files)
│               └── icon-1024.png
├── android/
│   └── app/
│       └── src/
│           └── main/
│               └── res/
│                   ├── drawable/
│                   │   └── splash_screen.xml  # Splash screen layout
│                   ├── values/
│                   │   └── colors.xml         # Splash screen colors
│                   ├── mipmap-mdpi/           # 48x48
│                   ├── mipmap-hdpi/           # 72x72
│                   ├── mipmap-xhdpi/          # 96x96
│                   ├── mipmap-xxhdpi/         # 144x144
│                   └── mipmap-xxxhdpi/        # 192x192
└── src/
    └── components/
        └── common/
            └── SplashScreen.tsx           # Custom splash component
```

## Next Steps

1. ✓ Generate icons with `yarn generate:icons`
2. ✓ Test on iOS simulator and real device
3. ✓ Test on Android emulator and real device
4. ✓ Verify splash screens display correctly
5. ✓ Submit to App Store / Play Store

---

**Note**: Always test on real devices before submission. Icon appearance can vary between simulator and physical devices.
