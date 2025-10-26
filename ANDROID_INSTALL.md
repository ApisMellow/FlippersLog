# Installing FlippersLog on Android

This guide will help you install and use FlippersLog on your Android phone.

## Before You Start

- **Android Version:** Android 7.0 or later (API 24+)
- **Storage:** ~100 MB free space
- **Internet:** Required for first launch to sync optional features

## Installation Steps

### Step 1: Get the APK File

You should have received the file `app-release.apk`. This is the FlippersLog app.

### Step 2: Enable Installation from Unknown Sources

Android requires you to explicitly allow installation of apps from outside the Google Play Store:

1. Open **Settings** on your Android phone
2. Go to **Security** (or **Apps & notifications** depending on Android version)
3. Look for **"Install unknown apps"** or **"Unknown sources"**
4. Enable it for your file browser or email app (whichever you used to receive the APK)

**Why?** This is a standard Android security feature. Since we're distributing this app directly rather than through the Play Store, you need to give permission.

### Step 3: Install the App

**Method 1: Using File Manager**
1. Open your **Files** or **File Manager** app
2. Navigate to **Downloads** (or wherever the APK is saved)
3. Tap the file `app-release.apk`
4. Tap **Install**
5. Wait for installation to complete
6. Tap **Open** or close and find FlippersLog in your app drawer

### Step 4: Grant Permissions

When you first open FlippersLog, it will request permissions:

**Camera Permission** - Used to take photos of pinball machine score displays
**Photo Library Permission** - Used to select photos from your phone's gallery

Both are optional - you can use manual entry if you don't grant them.

## Using FlippersLog

### Main Screen
- Shows your pinball tables and top scores
- Sorted by most recently played

### Capture Score (Camera)
1. Tap the **Capture** tab at bottom
2. Frame the pinball score display in your camera view
3. Tap the **white circle** to take a photo
4. Review and tap **Use Photo**
5. App extracts the score automatically
6. Review/edit and tap **Save**

### Manual Entry
1. Tap the **Manual Entry** tab
2. Type the pinball table name
3. Type the score
4. Tap **Save**

## Troubleshooting

### App won't install
- Verify "Install from unknown sources" is enabled
- Check that your phone has 100MB free storage
- Download the APK again to ensure it's not corrupt

### Can't use camera
- Settings > Apps > FlippersLog > Permissions > Enable Camera
- Close and reopen the app

### Can't access photo library
- Settings > Apps > FlippersLog > Permissions > Enable Photos
- Close and reopen the app

### App crashes on startup
- Uninstall the app
- Reinstall the APK
- Grant all permissions when prompted

### Photo analysis not working
- Make sure the photo is clear and readable
- Try taking another photo with better lighting
- Use Manual Entry as a fallback to type the score

## Verification

File size: **93 MB**

SHA256 checksum:
```
0d6dd1e68b024a05e19375561e5e55dc80ebac85085f68170d2f0f3a4834efd4
```

## Version Info

- **App:** FlippersLog
- **Version:** 1.1.0
- **Android Minimum:** 7.0 (API 24)
- **Android Target:** 15.0 (API 36)

---

Enjoy tracking your pinball high scores! 🎯
