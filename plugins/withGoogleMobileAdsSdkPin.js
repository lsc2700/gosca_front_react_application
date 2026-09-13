const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo 54 Kotlin 2.1.x cannot compile against play-services-ads 25.4.0
 * (metadata 2.3.0). Pin GMA to 24.7.0 for EAS release builds.
 */
const PINNED_ANDROID_GMA = '24.7.0';

function withGoogleMobileAdsSdkPin(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const pkgPath = path.join(
        mod.modRequest.projectRoot,
        'node_modules/react-native-google-mobile-ads/package.json',
      );
      if (!fs.existsSync(pkgPath)) return mod;
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.sdkVersions?.android?.googleMobileAds) {
        pkg.sdkVersions.android.googleMobileAds = PINNED_ANDROID_GMA;
        fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
      }
      return mod;
    },
  ]);
}

module.exports = withGoogleMobileAdsSdkPin;
