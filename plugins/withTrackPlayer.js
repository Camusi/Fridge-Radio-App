const { withAndroidManifest } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const EXTRA_PERMISSIONS = [
  'android.permission.WAKE_LOCK',
  'android.permission.FOREGROUND_SERVICE',
];

function getMusicServiceName() {
  try {
    const manifestPath = path.join(
      __dirname,
      '../node_modules/react-native-track-player/android/src/main/AndroidManifest.xml',
    );
    const content = fs.readFileSync(manifestPath, 'utf8');
    const match = content.match(/android:name="([^"]+MusicService[^"]*)"/);
    if (match) return match[1];
  } catch {}
  return 'com.doublesymmetry.trackplayer.service.MusicService';
}

module.exports = function withTrackPlayer(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;

    // Add permissions
    const existingPerms = manifest['uses-permission'] ?? [];
    const existingPermNames = new Set(existingPerms.map((p) => p.$['android:name']));
    for (const perm of EXTRA_PERMISSIONS) {
      if (!existingPermNames.has(perm)) {
        existingPerms.push({ $: { 'android:name': perm } });
      }
    }
    manifest['uses-permission'] = existingPerms;

    // Add MusicService
    const app = manifest.application[0];
    const services = app.service ?? [];
    const serviceName = getMusicServiceName();
    const alreadyAdded = services.some((s) => s.$['android:name'] === serviceName);
    if (!alreadyAdded) {
      services.push({
        $: {
          'android:name': serviceName,
          'android:enabled': 'true',
          'android:exported': 'true',
          'android:foregroundServiceType': 'mediaPlayback',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.MEDIA_BUTTON' } }],
          },
        ],
      });
    }
    app.service = services;

    return modConfig;
  });
};
