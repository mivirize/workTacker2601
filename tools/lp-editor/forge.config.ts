import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'

const config: ForgeConfig = {
  packagerConfig: {
    name: 'LP-Editor',
    executableName: 'LP-Editor',
    asar: true,
    appBundleId: 'com.lp-cms.editor',
    appCopyright: 'Copyright (C) 2024',
    ignore: [
      /^\/src/,
      /^\/\.git/,
      /^\/\.eslintrc/,
      /^\/\.npmrc/,
      /^\/tsconfig/,
      /^\/vite\.config/,
      /^\/electron\.vite/,
      /^\/forge\.config/,
      /^\/tailwind\.config/,
      /^\/postcss\.config/,
      /^\/\.vscode/,
      /^\/resources/,
      /\.ts$/,
      /\.tsx$/,
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'LP-Editor',
    }),
    new MakerZIP({}, ['darwin', 'win32']),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
  ],
}

export default config
