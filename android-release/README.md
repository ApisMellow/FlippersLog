# FlippersLog Android Distribution

This folder contains the Android APK distribution for FlippersLog version 1.1.0.

## Contents

- **flipperslog-v1.1.0.apk** - The Android application package (93MB)
- **ANDROID_INSTALL.md** - Detailed installation instructions for Android users
- **flipperslog-v1.1.0.apk.sha256** - SHA256 checksum for APK verification

## Quick Start

1. Transfer `flipperslog-v1.1.0.apk` to your Android device
2. Enable "Install from unknown sources" in Settings > Security
3. Open the APK file and tap Install
4. Follow the prompts to complete installation
5. Grant camera and photo permissions when prompted

For detailed instructions, see [ANDROID_INSTALL.md](./ANDROID_INSTALL.md)

## Verification

To verify the APK hasn't been tampered with, check the SHA256 checksum:

```bash
shasum -a 256 flipperslog-v1.1.0.apk
```

Expected checksum:
```
0d6dd1e68b024a05e19375561e5e55dc80ebac85085f68170d2f0f3a4834efd4
```

## Build Information

- **Version:** 1.1.0
- **Package Name:** com.flipperslog.app
- **Minimum Android Version:** 7.0 (API Level 24)
- **Target Android Version:** 15.0 (API Level 36)
- **Build Type:** Release
- **APK Size:** 93MB
- **Build Date:** October 25, 2025

## Features

- Camera integration for capturing pinball score displays
- Manual score entry
- Score history tracking
- Game information management
- Local data storage

## Permissions Required

- **Camera** - For capturing photos of pinball scores
- **Read Media Images** - For accessing existing photos

## Distribution

This APK can be distributed via:
- Direct file transfer (USB, Bluetooth, etc.)
- Cloud storage services (Google Drive, Dropbox, etc.)
- Email attachment
- Web download

## Support

For issues or questions about installation or usage, please refer to ANDROID_INSTALL.md or contact the developer.

## Technical Notes

- Built using React Native with Expo
- Native code compiled for arm64-v8a, armeabi-v7a, x86, and x86_64 architectures
- Unsigned release build (for development/testing)
- Uses Gradle build system

---

Built with Expo and React Native
