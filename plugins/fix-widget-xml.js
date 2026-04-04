const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Fix widget XML files to add "dp" units to minWidth and minHeight
 * This is a workaround for react-native-android-widget plugin bug
 * This plugin must run AFTER react-native-android-widget plugin
 */
function withFixWidgetXml(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      
      // Try multiple possible paths where the XML might be located
      const possiblePaths = [
        path.join(projectRoot, 'app/src/main/res/xml/widgetprovider_truluvwidget.xml'),
        path.join(projectRoot, 'src/main/res/xml/widgetprovider_truluvwidget.xml'),
        path.join(projectRoot, 'app/build/generated/res/resValues/release/xml/widgetprovider_truluvwidget.xml'),
        // EAS build paths
        path.join(projectRoot, 'build/android/app/src/main/res/xml/widgetprovider_truluvwidget.xml'),
        path.join(projectRoot, '../build/android/app/src/main/res/xml/widgetprovider_truluvwidget.xml'),
      ];

      // Also search recursively in res/xml directories
      const searchInDir = (dir) => {
        if (!fs.existsSync(dir)) return null;
        const xmlDir = path.join(dir, 'res', 'xml');
        if (fs.existsSync(xmlDir)) {
          const xmlFile = path.join(xmlDir, 'widgetprovider_truluvwidget.xml');
          if (fs.existsSync(xmlFile)) {
            return xmlFile;
          }
        }
        return null;
      };

      // Search in common locations
      const searchDirs = [
        path.join(projectRoot, 'app'),
        path.join(projectRoot, 'app/src/main'),
        projectRoot,
      ];

      for (const searchDir of searchDirs) {
        const found = searchInDir(searchDir);
        if (found) {
          possiblePaths.push(found);
        }
      }

      // Primary path where XML should be
      const primaryPath = path.join(projectRoot, 'app/src/main/res/xml/widgetprovider_truluvwidget.xml');
      
      // Ensure directory exists
      const xmlDir = path.dirname(primaryPath);
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Try to fix existing file or create correct one
      let content = '';
      if (fs.existsSync(primaryPath)) {
        content = fs.readFileSync(primaryPath, 'utf8');
      } else {
        // Create XML with correct format if it doesn't exist
        content = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="200dp"
    android:minHeight="200dp"
    android:updatePeriodMillis="0"
    android:initialLayout="@layout/widgetprovider_truluvwidget"
    android:description="Access messages, todos, sneak peek, and days together"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen" />`;
        fs.writeFileSync(primaryPath, content, 'utf8');
        console.log(`✅ Created widget XML with correct format at: ${primaryPath}`);
        return config;
      }
      
      // Fix existing content
      const originalContent = content;
      content = content.replace(
        /android:minWidth="(\d+)"/g,
        'android:minWidth="$1dp"'
      );
      content = content.replace(
        /android:minHeight="(\d+)"/g,
        'android:minHeight="$1dp"'
      );
      
      if (content !== originalContent) {
        fs.writeFileSync(primaryPath, content, 'utf8');
        console.log(`✅ Fixed widget XML at: ${primaryPath}`);
      } else if (content.includes('minWidth="200dp"') && content.includes('minHeight="200dp"')) {
        console.log(`✅ Widget XML already correct at: ${primaryPath}`);
      }
      
      return config;
    },
  ]);
}

module.exports = withFixWidgetXml;
