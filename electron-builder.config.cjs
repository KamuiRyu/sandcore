const pkg = require('./package.json');
const versionStr = pkg.version.replace(/\./g, '_');

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: "com.kamuiryu.shinobimap",
  productName: "Shinobi Map",
  executableName: "shinobi_map",
  directories: {
    output: "release"
  },
  files: ["dist/**/*", "dist-electron/**/*", "package.json"],
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"]
      },
      {
        target: "portable",
        arch: ["x64"]
      }
    ],
    icon: "public/icon.ico"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Shinobi Map",
    artifactName: `shinobi_map_${versionStr}_setup.\${ext}`
  },
  portable: {
    artifactName: `shinobi_map.\${ext}`
  },
 publish: {
    provider: "github",
    releaseType: "release" 
  },
};
