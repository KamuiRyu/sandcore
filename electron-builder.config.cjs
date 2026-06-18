const pkg = require("./package.json");
const versionStr = pkg.version.replace(/\./g, "_");

module.exports = {
  appId: "com.hyoou.shinobimap",
  productName: "Shinobi Map",
  executableName: "ShinobiMap",
  compression: "maximum",
  directories: {
    output: "release",
  },
  files: ["dist/**/*", "dist-electron/**/*", "package.json"],

  win: {
    icon: "public/icon.ico",
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
      {
        target: "portable",
        arch: ["x64"],
      },
    ],
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    include: "build/nsis/installer.nsh",
    artifactName: "ShinobiMap_" + versionStr + "_setup.${ext}",
  },

  portable: {
    artifactName: "ShinobiMap_" + versionStr + "_portable.${ext}",
  },

  publish: {
    provider: "github",
    owner: "KamuiRyu",
    repo: "slp-map",
    releaseType: "release",
  },
};
