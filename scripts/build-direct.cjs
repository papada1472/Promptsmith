#!/usr/bin/env node
// Direct build script that uses electron-builder's API directly
import('electron-builder').then(mod => {
  const { build } = mod;
  
  console.log('Starting build with API...');
  
  build({
    config: {
      appId: 'com.refinzi.app',
      productName: 'Refinzi',
      asar: true,
      directories: {
        output: 'dist'
      },
      files: [
        'src/**/*',
        'assets/**/*',
        'package.json'
      ],
      win: {
        icon: 'assets/icons/app.ico',
        target: ['nsis'],
        sign: false,
        signDlls: false,
        certificateSubjectName: '',
        certificateFile: ''
      },
      nsis: {
        oneClick: true,
        perMachine: false,
        allowToChangeInstallationDirectory: false,
        createDesktopShortcut: false,
        createStartMenuShortcut: true,
        shortcutName: 'Refinzi',
        artifactName: 'Refinzi-Setup-v${version}.exe'
      }
    },
    publish: null,
    win: ['nsis']
  }).then(result => {
    console.log('Build succeeded!');
    console.log(JSON.stringify(result, null, 2));
  }).catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}).catch(err => {
  console.error('Failed to import electron-builder:', err.message);
  process.exit(1);
});