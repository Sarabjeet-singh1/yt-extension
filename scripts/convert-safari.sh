#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/safari"
APP_NAME="${APP_NAME:-YouTube Downloader Safari}"
BUNDLE_ID="${BUNDLE_ID:-com.sarabjeetsingh.ytdownloader}"

if ! command -v xcrun >/dev/null 2>&1; then
  echo "xcrun not found. Install Xcode command line tools first:"
  echo "xcode-select --install"
  exit 1
fi

echo "Converting Web Extension to Safari project..."
echo "Extension folder: $ROOT_DIR"
echo "Output folder:    $OUTPUT_DIR"
echo "App name:         $APP_NAME"
echo "Bundle id:        $BUNDLE_ID"

xcrun safari-web-extension-converter "$ROOT_DIR" \
  --project-location "$OUTPUT_DIR" \
  --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" \
  --macos-only \
  --no-prompt \
  --force \
  --no-open

# Remove fixed team signing so local builds use ad-hoc signing without keychain cert prompts.
PBXPROJ_PATH="$OUTPUT_DIR/$APP_NAME/$APP_NAME.xcodeproj/project.pbxproj"
if [[ -f "$PBXPROJ_PATH" ]]; then
  sed -i '' '/DEVELOPMENT_TEAM = /d' "$PBXPROJ_PATH"
  sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = \\\"com\\.sarabjeetsingh\\.YouTube-Downloader-Safari\\\";/PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID};/g" "$PBXPROJ_PATH"
  sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID}\\.Extension;/PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID}.Extension;/g" "$PBXPROJ_PATH"
fi

echo ""
echo "Done. Open the Xcode project inside:"
echo "  $OUTPUT_DIR"
echo "Then run the app target to install and enable the Safari extension."
