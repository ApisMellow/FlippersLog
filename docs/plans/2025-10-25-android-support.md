# Android Support Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Enable FlippersLog to run on Android with APK distribution, verified with Android emulator and sample photos.

**Architecture:** Use Expo's cross-platform APIs (Camera, ImagePicker) which already work on Android. Verify permissions work correctly, test with emulator and sample photos, build APK for distribution.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, EAS (Expo Application Services) for cloud builds

---

## Context

FlippersLog currently works on iOS via TestFlight. The app uses Expo's cross-platform APIs:
- `expo-camera` for camera capture
- `expo-image-picker` for photo library access
- `expo-image-manipulator` for JPEG conversion
- AsyncStorage for data persistence
- Claude Vision API for score/table detection

All these APIs have Android support. The goal is to verify they work correctly on Android, test with sample photos, and build an APK for distribution to an Android friend.

---

## Task 1: Set Up Android Emulator

**Files:**
- No code changes needed
- Environment: Android emulator installation

**Step 1: Verify Node.js and npm versions**

Run: `node --version && npm --version`

Expected: Node 18+ and npm 8+

**Step 2: Install Android emulator (if not already installed)**

Run: `npx expo-doctor`

Expected: Output shows Android SDK status and recommendations

**Step 3: List available emulators**

Run: `emulator -list-avds`

Expected: Either lists existing emulators or shows "no avds"

**Step 4: Create Android emulator if needed**

If no emulators exist, run: `npx eas device:create`

This will guide you through creating a virtual Android device (Pixel 5, Android 13+).

**Step 5: Verify emulator can start**

Run: `emulator -avd <avd-name>` (replace with emulator name)

Wait 30-60 seconds for Android startup.

Expected: Emulator boots to Android home screen

**Step 6: Commit**

No files changed - verification only. No commit needed.

---

## Task 2: Load Sample Photos into Emulator

**Files:**
- Source: 3 sample pinball photos you have saved
- Destination: Emulator's photo gallery

**Step 1: Find your 3 sample photos**

Verify you have 3 pinball machine photos ready. Note their paths.

**Step 2: Start emulator if not running**

Run: `emulator -avd <avd-name> &`

Wait for Android home screen to appear.

**Step 3: Copy photos to emulator using adb**

For each photo, run:
```bash
adb push /path/to/photo1.jpg /sdcard/DCIM/Camera/photo1.jpg
adb push /path/to/photo2.jpg /sdcard/DCIM/Camera/photo2.jpg
adb push /path/to/photo3.jpg /sdcard/DCIM/Camera/photo3.jpg
```

Replace `/path/to/photoN.jpg` with actual paths to your photos.

**Step 4: Verify photos in emulator**

In emulator:
1. Open "Photos" or "Gallery" app
2. Navigate to Camera folder
3. Verify all 3 pinball photos appear

Expected: All 3 photos visible in gallery

**Step 5: Commit**

No code changes - setup only. No commit needed.

---

## Task 3: Verify Expo Dependencies Work on Android

**Files:**
- `package.json` (verify existing)
- No code changes

**Step 1: Check expo and related packages**

Run: `npm list expo expo-camera expo-image-picker expo-image-manipulator`

Expected output shows versions:
- expo@54.0.17 (or later)
- expo-camera~17.0.0
- expo-image-picker~17.0.8
- expo-image-manipulator@14.0.7

**Step 2: Verify all are installed**

Run: `ls node_modules | grep -E "expo-(camera|image-picker|image-manipulator)"`

Expected: All three packages listed

**Step 3: Check app.json for Android configuration**

Run: `cat app.config.js | grep -A 20 "android"`

Expected: Should show Android configuration (or be absent, which is fine - Expo uses defaults)

**Step 4: Commit (if any changes)**

No changes expected - verification only. No commit needed.

---

## Task 4: Start Expo Dev Server and Connect Emulator

**Files:**
- No code changes
- `package.json` (existing scripts)

**Step 1: Start Expo dev server in worktree directory**

Run: `cd /Users/david/dev/FlippersLog/.worktrees/android-support && npm start`

Expected: Expo CLI shows menu with options:
```
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Press r │ reload
› Press q │ quit
```

**Step 2: Start Android emulator in separate terminal**

Run: `emulator -avd <avd-name> &`

**Step 3: Wait for emulator to boot**

Wait 30-60 seconds for Android home screen.

**Step 4: Connect emulator to Expo dev server**

In Expo CLI terminal, press `a` to open Android.

Expected: Expo Expo Go app opens and connects to dev server, app loads.

**Step 5: Verify app loads**

Expected to see:
- FlippersLog main screen (list of pinball scores)
- Bottom navigation with "Capture" and "Manual Entry" tabs
- No errors in console

**Step 6: Commit**

No code changes. No commit needed.

---

## Task 5: Test Camera Permissions (Android)

**Files:**
- `app/capture.tsx` (existing - verify behavior)
- No code changes needed

**Step 1: Navigate to Capture screen**

In app running on emulator:
1. Tap "Capture" tab
2. Should see permission request screen

**Step 2: Test permission grant flow**

On permission screen:
1. Tap "Grant Permission"
2. Emulator shows native Android permission dialog
3. Tap "Allow" (grant camera permission)

Expected: Camera view opens, shows camera preview

**Step 3: Test camera capture**

1. Tap the large white circle (capture button)
2. Camera should take photo and show preview

Expected: Photo preview displays, "Retake" and "Use Photo" buttons visible

**Step 4: Test permission deny flow**

Go back and test deny:
1. Clear app data: `adb shell pm clear com.example.flipperslog` (or get actual package name)
2. Reopen Capture screen
3. When permission dialog appears, tap "Deny"

Expected: Permission denied screen shows, "Grant Permission" button visible

**Step 5: Verify no crashes**

Check console for errors:
Run: `adb logcat | grep -i error`

Expected: No permission-related errors

**Step 6: Commit**

No code changes. No commit needed.

---

## Task 6: Test Photo Library Picker (Android)

**Files:**
- `app/capture.tsx` (existing - verify behavior)
- No code changes needed

**Step 1: Grant camera permission again (if needed)**

Repeat Task 5 Step 2 to grant camera permission.

**Step 2: Tap photo library button**

In Capture screen camera view:
1. Tap the photos icon (left button) in control bar
2. Should request media library permission

Expected: Android native permission dialog appears

**Step 3: Grant photo library permission**

Tap "Allow" on permission dialog.

Expected: Photo picker opens showing Camera folder

**Step 4: Select a photo**

1. Verify 3 sample photos are visible
2. Tap one of them

Expected: Photo picker closes, photo preview displays in capture screen

**Step 5: Test photo picker deny**

Go back and test deny flow:
1. Clear app data again
2. Reopen Capture and tap photos icon
3. When permission dialog appears, tap "Deny"

Expected: Alert appears saying "Permission Required" with helpful message

**Step 6: Verify permissions work**

Check that:
- Photo picker shows photos you loaded in Task 2
- No crashes in console
- Permission dialogs appear (native Android dialogs, not custom)

Expected: Emulator shows native Android permission UI

**Step 7: Commit**

No code changes. No commit needed.

---

## Task 7: Test AI Photo Analysis with Sample Photos (Android)

**Files:**
- `services/ai-vision.ts` (existing - verify behavior)
- No code changes needed
- Test photos: Use the 3 samples from Task 2

**Step 1: Navigate to Capture screen**

Grant camera permission if needed (see Task 5).

**Step 2: Select a sample photo**

1. Tap photos icon
2. Grant photo library permission if needed
3. Select first sample photo
4. Verify preview displays correctly

Expected: Photo preview shows

**Step 3: Tap "Use Photo"**

Expected: Shows "Analyzing photo with AI..." overlay

**Step 4: Wait for analysis**

Wait 10-30 seconds for Claude API call.

Expected output (one of):
- Success: Redirects to review-score screen showing detected table/score
- Mock data: If no API key, shows mock Medieval Madness score
- Error: Redirects to edit-score screen (fallback on error)

**Step 5: Verify AI analysis works**

If API key configured:
- Check that score was detected from photo
- Check that table name was detected (if visible in photo)
- Verify numbers match what's actually in photo

**Step 6: Test with all 3 sample photos**

Repeat Steps 2-5 with remaining 2 photos.

Expected: All 3 photos analyze without crashes

**Step 7: Verify no platform-specific errors**

Run: `adb logcat | grep -i "error\|exception" | head -20`

Expected: No errors related to image processing

**Step 8: Commit**

No code changes. No commit needed.

---

## Task 8: Test Full Score Entry Flow (Android)

**Files:**
- `app/review-score.tsx` (existing)
- `services/storage.ts` (existing)
- No code changes needed

**Step 1: Get to score review screen**

From Task 7: After AI analyzes a photo, you should see review-score screen.

**Step 2: Verify detected values**

Review screen should show:
- Photo preview
- Detected table name
- Detected score
- Confidence level

Expected: All values match AI analysis from Task 7

**Step 3: Modify values if needed (optional)**

1. Tap on score or table name to edit
2. Change values to test
3. Verify edits work

Expected: Fields are editable

**Step 4: Save the score**

Tap "Save Score" button.

Expected: Navigates back to main screen, score added to list

**Step 5: Verify score persisted**

1. Navigate to main screen (if not already there)
2. Verify new pinball table appears in list
3. Verify score displays

Expected: Score visible in list with correct values

**Step 6: Test offline persistence**

Close app completely and reopen:
1. Kill app: `adb shell am force-stop com.example.flipperslog`
2. Reopen app (tap app icon)
3. Verify saved score still appears

Expected: Score persists after app restart

**Step 7: Commit**

No code changes. No commit needed.

---

## Task 9: Test Manual Entry (Android)

**Files:**
- `app/manual-entry.tsx` (existing)
- No code changes needed

**Step 1: Navigate to Manual Entry screen**

Tap "Manual Entry" tab at bottom.

Expected: Manual entry form displays

**Step 2: Fill in form**

1. Enter a table name (e.g., "Theater of Magic")
2. Enter a score (e.g., "12345678")
3. Verify inputs work

Expected: Form accepts input, no crashes

**Step 3: Submit form**

Tap "Save Score" button.

Expected: Score saved, returns to main screen

**Step 4: Verify saved**

Check that new score appears in main list.

Expected: Manual entry persisted to AsyncStorage

**Step 5: Commit**

No code changes. No commit needed.

---

## Task 10: Verify All Tests Still Pass on Main Branch

**Files:**
- `__tests__/**/*.test.ts` (existing)
- No code changes needed

**Step 1: Run test suite**

Run: `npm test`

Expected: All tests pass (should be 2+ tests)

**Step 2: Verify no new failures**

Expected: Same test count as baseline (Task 1 of worktree setup showed 2 passing)

**Step 3: Commit (if any fixes needed)**

If tests fail, fix and commit. Otherwise no commit needed.

---

## Task 11: Build APK for Distribution

**Files:**
- `app.config.js` (verify Android config)
- `eas.json` (may need to create)
- No code changes to app logic

**Step 1: Check if eas.json exists**

Run: `ls -la eas.json`

If not found, create it (see Step 2).

**Step 2: Create eas.json if needed**

Create file: `eas.json`

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**Step 3: Verify app.config.js has Android config**

Run: `cat app.config.js | grep -A 5 "android"`

Should show Android config or be minimal (Expo uses defaults).

Current app.config.js should have:
```javascript
android: {
  adaptiveIcon: {
    foregroundImage: './assets/adaptive-icon.png',
    backgroundColor: '#ffffff',
  },
},
```

**Step 4: Build APK locally**

Run: `eas build --platform android --local`

This builds APK on your machine (requires Android SDK installed).

Expected: Build completes, outputs APK file path

**Alternative: Cloud build (if local fails)**

Run: `eas build --platform android --no-cache`

This builds on Expo's servers (no local Android SDK needed, but slower).

Expected: Build completes, outputs .apk file path

**Step 5: Locate APK file**

Run: `find . -name "*.apk" -type f | head -5`

Expected: Shows path to generated APK (e.g., `./build/app-release.apk`)

**Step 6: Verify APK size**

Run: `ls -lh <path-to-apk>`

Expected: File size 50-100MB (reasonable for Expo app)

**Step 7: Commit eas.json**

```bash
git add eas.json
git commit -m "build: add EAS configuration for APK builds"
```

---

## Task 12: Prepare APK for Distribution

**Files:**
- APK file from Task 11
- Distribution method: Direct file transfer

**Step 1: Copy APK to easy location**

Run: `cp <apk-from-task-11> ~/Desktop/flipperslog.apk`

(Or any location easy for your friend to access)

**Step 2: Create installation instructions**

Create file: `ANDROID_INSTALL.md`

```markdown
# Installing FlippersLog on Android

## What You Need
- Android phone (Android 10+)
- USB cable (or WiFi file transfer)
- The flipperslog.apk file

## Installation Steps

1. **Transfer APK to phone:**
   - Download flipperslog.apk to your phone
   - Or use USB cable to transfer from computer

2. **Enable installation from unknown sources:**
   - Go to Settings > Security
   - Enable "Install from unknown sources" (or "Allow installation from this source")

3. **Install the app:**
   - Open Files app
   - Navigate to Downloads (or where you saved the APK)
   - Tap flipperslog.apk
   - Tap "Install"

4. **Grant permissions:**
   - When you open the app, it will request camera and photo library permissions
   - Tap "Allow" to grant permissions

5. **Start logging scores!**
   - Tap "Capture" to take a photo of a pinball score display
   - Or use "Manual Entry" to type in scores manually

## Troubleshooting

**App won't install:**
- Verify unknown sources is enabled in Settings > Security
- Try again

**Can't access camera:**
- Go to Settings > Apps > FlippersLog > Permissions > Camera
- Enable Camera permission

**Can't access photos:**
- Go to Settings > Apps > FlippersLog > Permissions > Photos
- Enable Photos permission

**AI photo analysis not working:**
- This requires an API key (internal feature)
- Manual entry will always work
```

**Step 3: Create APK checksum**

Run: `shasum -a 256 <apk-path> > flipperslog.apk.sha256`

This helps your friend verify the file wasn't corrupted.

**Step 4: Prepare distribution package**

Create folder: `android-release/`

```bash
mkdir android-release
cp <apk-path> android-release/flipperslog.apk
cp flipperslog.apk.sha256 android-release/
cp ANDROID_INSTALL.md android-release/
```

**Step 5: Test APK on emulator once more**

Run: `adb install -r <apk-path>`

Expected: APK installs on emulator, app launches

**Step 6: Verify app functionality**

Test on emulator:
1. Open app
2. Try capturing photo (should work if permissions granted)
3. Try saving a score
4. Close and reopen (verify persistence)

Expected: App works normally

**Step 7: Commit**

```bash
git add ANDROID_INSTALL.md eas.json
git commit -m "docs: add Android installation instructions and build config"
```

---

## Task 13: Create Final Summary Documentation

**Files:**
- `ANDROID_BUILD.md` (create new)

**Step 1: Create build documentation**

Create file: `ANDROID_BUILD.md`

```markdown
# Android Build & Distribution Summary

## What Was Done

✅ Verified Expo Camera and ImagePicker work on Android
✅ Tested camera capture and photo library access
✅ Tested AI photo analysis with sample pinball photos
✅ Tested full score entry and persistence flow
✅ Built APK for distribution

## Testing Done

- Android emulator (Pixel 5, Android 13+)
- Camera permissions (grant and deny flows)
- Photo library permissions (grant and deny flows)
- Photo picker (selected sample images)
- AI analysis (Claude Vision API integration)
- Score persistence (AsyncStorage on Android)
- Manual entry (alternative input method)

## Build Process

```bash
# Build APK locally (requires Android SDK)
eas build --platform android --local

# OR build in cloud (no local Android SDK)
eas build --platform android --no-cache
```

## Distribution

See `ANDROID_INSTALL.md` for installation instructions to share with Android users.

## Platform-Specific Notes

### Camera
- Android uses different permission model (permission dialogs vary by Android version)
- Expo abstracts this - `expo-camera` handles it automatically
- Camera orientation works correctly on both platforms

### Photo Library
- Android "All Media" includes recent + Camera folder
- Expo's ImagePicker handles this automatically
- Both platforms return URI and can convert to base64

### Image Conversion
- `expo-image-manipulator` works on Android
- HEIC → JPEG conversion works on both
- Resize to 1568px for API compatibility works on both

### AsyncStorage
- Works identically on both platforms
- Data persists through app restart
- No platform-specific changes needed

## Future Considerations

- Could release on Google Play Store (requires Google Play account, signing key, store listing)
- Could use Firebase App Distribution for easier sharing
- Could implement platform-specific optimizations (e.g., native camera features)

For now, direct APK distribution is simplest path for sharing with friends.
```

**Step 2: Commit**

```bash
git add ANDROID_BUILD.md
git commit -m "docs: add comprehensive Android build documentation"
```

---

## Task 14: Final Verification & Branch Completion

**Files:**
- No code changes
- Verification steps only

**Step 1: Verify all tests pass**

Run: `npm test`

Expected: All tests pass, no regressions

**Step 2: Verify git history**

Run: `git log --oneline | head -10`

Expected: Show commits from this branch

**Step 3: Verify branch name**

Run: `git status`

Expected: Shows "On branch feature/android-support"

**Step 4: Check file changes**

Run: `git diff main..HEAD --stat`

Expected: Shows added files (eas.json, ANDROID_INSTALL.md, ANDROID_BUILD.md)

**Step 5: Summary**

Run: `git log --oneline main..HEAD`

Expected: Shows all commits made during Android support work

---

## Summary

**What This Accomplishes:**
1. ✅ Verifies Android emulator and Expo dev server work
2. ✅ Loads sample pinball photos into emulator
3. ✅ Tests camera capture on Android
4. ✅ Tests photo library access on Android
5. ✅ Tests AI photo analysis end-to-end
6. ✅ Verifies score persistence (AsyncStorage)
7. ✅ Tests alternative entry method (manual)
8. ✅ Builds production APK for distribution
9. ✅ Creates installation guide for friend
10. ✅ Documents platform-specific findings

**No Code Changes Needed:** Expo's APIs are cross-platform. All verification is through testing on emulator, no application code changes required.

**Distribution:** APK file ready for your Android friend to install directly on their phone.

**Next Steps:** After this plan completes, you can:
1. Send APK + instructions to your friend
2. Optionally release on Google Play Store
3. Consider future platform-specific optimizations
