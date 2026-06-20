const pkg = require("./package.json");
const versionStr = pkg.version.replace(/\./g, "_");

module.exports = {
  appId: "com.hyoou.sandcore",
  productName: "SandCore",
  executableName: "SandCore",
  compression: "maximum",
  directories: {
    output: "release",
  },
  publish: [
    {
      provider: "github",
      owner: "KamuiRyu",
      repo: "sandcore"
    }
  ],
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
    artifactName: "SandCore_" + versionStr + "_setup.${ext}",
  },

  portable: {
    artifactName: "SandCore_" + versionStr + "_portable.${ext}",
  },
};
