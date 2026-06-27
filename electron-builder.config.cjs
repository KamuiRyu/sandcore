const pkg = require("./package.json");
const versionStr = pkg.version.replace(/\./g, "_");

module.exports = {
  appId: "com.hyoou.sandcore",
  productName: "SandCore",
  executableName: "SandCore",
  compression: "normal",
  directories: {
    output: "release",
  },
  publish: [
    {
      provider: "github",
      owner: "KamuiRyu",
      repo: "sandcore",
    },
  ],
  files: ["dist/**/*", "dist-electron/**/*", "package.json"],

  extraResources: [
    {
      from: "build/updater/SandCoreUpdater.exe",
      to: "SandCoreUpdater.exe",
    },
  ],

  win: {
    icon: "public/icon.ico",
    target: [
      {
        target: "zip",
        arch: ["x64"],
      },
    ],
    artifactName: "${productName}-${version}-win.${ext}",
  },
};
