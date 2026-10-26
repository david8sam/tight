import path from 'node:path';

export function windowsInstallerConfig(root, manifest, mode, environment = process.env) {
    if (!['preview', 'release'].includes(mode)) throw new Error('Installer mode must be preview or release');
    if (mode === 'preview' && (environment.CSC_LINK || environment.WIN_CSC_LINK || environment.CSC_NAME || environment.CSC_KEY_PASSWORD || environment.WIN_CSC_KEY_PASSWORD))
        throw new Error('Preview installers must be unsigned. Remove signing credentials or select release mode.');
    if (mode === 'release') {
        if (environment.WIN_CSC_LINK || environment.WIN_CSC_KEY_PASSWORD || environment.CSC_NAME)
            throw new Error('Release installers reject competing signing aliases. Use only CSC_LINK and CSC_KEY_PASSWORD.');
        if (!environment.CSC_LINK || !environment.CSC_KEY_PASSWORD)
            throw new Error('Release installers require CSC_LINK and CSC_KEY_PASSWORD publisher credentials.');
        if (!path.isAbsolute(environment.CSC_LINK))
            throw new Error('CSC_LINK must be the absolute path of the publisher certificate mounted by the release secret store.');
        let review;
        if (environment.TIGHT_RIGHTS_REVIEW_URL && URL.canParse(environment.TIGHT_RIGHTS_REVIEW_URL))
            review = new URL(environment.TIGHT_RIGHTS_REVIEW_URL);
        if (!review || review.protocol !== 'https:' || review.username || review.password)
            throw new Error('Release installers require TIGHT_RIGHTS_REVIEW_URL pointing to the completed distribution-rights review.');
    }
    return {
        appId: 'org.alvinxiao.tight',
        productName: 'TIGHT',
        copyright: 'Copyright © 2020 david8sam and TIGHT contributors',
        electronVersion: manifest.devDependencies.electron,
        forceCodeSigning: mode === 'release',
        directories: { output: path.join(root, 'release', 'installer') },
        artifactName: `TIGHT-\${version}-windows-\${arch}-${mode}-setup.\${ext}`,
        win: {
            target: [{ target: 'nsis', arch: ['x64'] }],
            icon: path.join(root, 'desktop', 'icon.ico'),
            signAndEditExecutable: mode === 'release',
            signExecutable: mode === 'release',
        },
        nsis: {
            include: path.join(root, 'desktop', 'installer.nsh'),
            oneClick: false,
            perMachine: false,
            allowElevation: false,
            allowToChangeInstallationDirectory: false,
            createDesktopShortcut: false,
            createStartMenuShortcut: true,
            shortcutName: 'TIGHT',
            uninstallDisplayName: `TIGHT ${mode}`,
            deleteAppDataOnUninstall: false,
            runAfterFinish: false,
            license: path.join(root, 'LICENSE'),
        },
        publish: null,
    };
}
