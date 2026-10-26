const { app, BrowserWindow, dialog, session, utilityProcess, ipcMain, Menu, powerMonitor } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { createSharingPreferences } = require('./sharing-preference.cjs');
const { readBuildIdentity } = require('./build-identity.cjs');
const { createDiagnostics, errorCode } = require('./diagnostics.cjs');

app.setName('TIGHT');
app.setAppUserModelId('org.alvinxiao.tight');
if (process.env.TIGHT_DATA_DIR) {
    const profile = path.join(path.resolve(process.env.TIGHT_DATA_DIR), 'desktop-profile');
    try {
        fs.mkdirSync(profile, { recursive: true });
        app.setPath('userData', profile);
    } catch {
        // Keep native recovery and export available when the game folder cannot be opened.
    }
}

const diagnostics = createDiagnostics(
    path.join(
        process.env.TIGHT_DATA_DIR ? path.resolve(process.env.TIGHT_DATA_DIR) : app.getPath('userData'),
        'diagnostics',
    ),
);
let backendState = 'stopped';
let powerChanges = Promise.resolve();
let window;
let child;
let quitting = false;
let recovering = false;
let quitPrompt = false;
let activeOrigin;
let activeHostToken;
let sharingRestoreError = null;
let sharingPreferences;
const sharingPreferencePath = () => path.join(app.getPath('userData'), 'sharing.json');
const sharingStatus = value => ({ ...value, ...(sharingRestoreError ? { restoreError: sharingRestoreError } : {}) });
let backendRequestId = 0;
const backendRequests = new Map();
const expectedExits = new WeakSet();

function requestBackend(address, change, type = 'hosting') {
    const current = child;
    if (!current || quitting) return Promise.reject(new Error('The game server is not running.'));
    return new Promise((resolve, reject) => {
        const id = ++backendRequestId;
        const timer = setTimeout(() => {
            backendRequests.delete(id);
            reject(new Error('The host did not respond. Refresh the network list.'));
        }, 10000);
        backendRequests.set(id, { child: current, type, resolve, reject, timer });
        try {
            current.postMessage({ type, id, change, address });
        } catch (error) {
            clearTimeout(timer);
            backendRequests.delete(id);
            reject(error);
        }
    });
}
function backendReply(current, message) {
    if (!message || !['hosting', 'diagnostics'].includes(message.type) || !Number.isSafeInteger(message.id)) return;
    const pending = backendRequests.get(message.id);
    if (!pending || pending.child !== current || pending.type !== message.type) return;
    clearTimeout(pending.timer);
    backendRequests.delete(message.id);
    if (typeof message.error === 'string')
        pending.reject(Object.assign(new Error(message.error), { code: errorCode(message) }));
    else {
        if (message.type === 'hosting' && window && !window.isDestroyed())
            window.setTitle(message.value?.mode === 'lan' ? 'TIGHT (Wi-Fi sharing)' : 'TIGHT (local only)');
        pending.resolve(message.value);
    }
}
async function verifyHostFrame(event) {
    if (
        !window ||
        event.sender !== window.webContents ||
        event.senderFrame !== window.webContents.mainFrame ||
        !activeOrigin ||
        new URL(event.senderFrame.url).origin !== activeOrigin
    )
        throw new Error('Hosting controls are available only in the host window.');
    const cookies = await session.defaultSession.cookies.get({ url: activeOrigin, name: 'tight-session' });
    if (!activeHostToken || !cookies.some(cookie => cookie.value === activeHostToken))
        throw new Error('Hosting controls require the host session.');
}

function isReady(message) {
    if (!message || message.type !== 'ready' || message.protocolVersion !== 2 || typeof message.origin !== 'string')
        return false;
    try {
        const url = new URL(message.origin);
        return (
            typeof message.hostToken === 'string' &&
            /^[A-Za-z0-9_-]{43}$/.test(message.hostToken) &&
            url.protocol === 'http:' &&
            url.hostname === '127.0.0.1' &&
            Number(url.port) > 1024 &&
            url.username === '' &&
            url.password === '' &&
            url.pathname === '/' &&
            url.search === '' &&
            url.hash === ''
        );
    } catch {
        return false;
    }
}

async function stopBackend() {
    const current = child;
    if (!current) return;
    expectedExits.add(current);
    await new Promise(resolve => {
        const timeout = setTimeout(() => {
            diagnostics.record('backend.stop-timeout');
            current.kill();
        }, 5000);
        current.once('exit', () => {
            clearTimeout(timeout);
            resolve();
        });
        try {
            current.postMessage({ type: 'stop' });
        } catch {
            current.kill();
        }
    });
    if (child === current) child = undefined;
}

function startBackend() {
    activeHostToken = undefined;
    backendState = 'starting';
    diagnostics.record('backend.starting');
    return new Promise((resolve, reject) => {
        const env = { ...process.env, TIGHT_USE_HTTP: 'true' };
        delete env.NODE_OPTIONS;
        delete env.ELECTRON_RUN_AS_NODE;
        const current = utilityProcess.fork(path.join(__dirname, 'backend.cjs'), [], {
            env,
            stdio: 'pipe',
            serviceName: 'TIGHT game server',
        });
        child = current;
        // Drain output without retaining game snapshots or credentials in native diagnostics.
        current.stdout?.on('data', () => {});
        current.stderr?.on('data', () => {});
        let ready = false;
        const timeout = setTimeout(() => {
            current.kill();
            reject(new Error('The game server did not start in time.'));
        }, 20000);
        current.on('message', message => {
            if (message?.type === 'diagnostic') {
                if (['backend.start-failed', 'storage.write-failed'].includes(message.event))
                    diagnostics.record(message.event, message.code);
                return;
            }
            if (ready) {
                backendReply(current, message);
                return;
            }
            if (!isReady(message)) {
                current.kill();
                reject(new Error('The game server returned invalid startup information.'));
                return;
            }
            ready = true;
            backendState = 'ready';
            diagnostics.record('backend.ready');
            clearTimeout(timeout);
            resolve({ origin: message.origin, hostToken: message.hostToken });
        });
        current.once('exit', () => {
            backendState = 'stopped';
            diagnostics.record(
                expectedExits.has(current) ? 'backend.stopped' : ready ? 'backend.crashed' : 'backend.start-failed',
            );
            clearTimeout(timeout);
            for (const [id, pending] of backendRequests)
                if (pending.child === current) {
                    clearTimeout(pending.timer);
                    pending.reject(new Error('The game server stopped.'));
                    backendRequests.delete(id);
                }
            if (child === current) child = undefined;
            if (!ready)
                reject(
                    new Error(
                        'The game server could not open its saved games. Check that another host is not using this data folder and that storage is available.',
                    ),
                );
            else if (!quitting && !expectedExits.has(current))
                void recover('The game server stopped. Your committed games are saved. Restart the server to resume.');
        });
    });
}

async function recover(message) {
    if (quitting || recovering) return;
    recovering = true;
    if (window && !window.isDestroyed()) window.hide();
    const result = await dialog.showMessageBox({
        type: 'error',
        title: 'TIGHT could not host games',
        message,
        buttons: ['Restart server', 'Quit', 'Export diagnostics'],
        defaultId: 0,
        cancelId: 1,
    });
    recovering = false;
    if (result.response === 0) void launch();
    else if (result.response === 2) {
        await exportDiagnostics();
        void recover(message);
    } else {
        quitting = true;
        await rememberSharing();
        await stopBackend();
        app.quit();
    }
}

function configureWindow(origin) {
    if (window && !window.isDestroyed()) window.destroy();
    activeOrigin = origin;
    window = new BrowserWindow({
        width: 1200,
        height: 850,
        minWidth: 390,
        minHeight: 500,
        title: 'TIGHT (local only)',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            devTools: !app.isPackaged,
        },
    });
    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            { label: 'Help', submenu: [{ label: 'Export diagnostics...', click: () => void exportDiagnostics() }] },
        ]),
    );
    window.on('page-title-updated', event => event.preventDefault());
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    const guardNavigation = event => {
        try {
            if (new URL(event.url).origin === origin) return;
        } catch {}
        event.preventDefault();
    };
    window.webContents.on('will-navigate', guardNavigation);
    window.webContents.on('will-redirect', guardNavigation);
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    window.on('session-end', () => void stopForSystemShutdown());
    window.on('close', event => {
        if (!quitting) {
            event.preventDefault();
            void requestQuit();
        }
    });
    window.once('ready-to-show', () => window?.show());
    window.webContents.on('render-process-gone', () => {
        if (!quitting) void recover('The app window stopped. Restart the server to reopen your saved games.');
    });
    return window.loadURL(origin);
}

async function launch() {
    try {
        await stopBackend();
        const { origin, hostToken } = await startBackend();
        activeHostToken = hostToken;
        await session.defaultSession.cookies.set({
            url: origin,
            name: 'tight-session',
            value: hostToken,
            httpOnly: true,
            sameSite: 'strict',
            secure: false,
        });
        sharingRestoreError = await sharingPreferences.restore();
        await configureWindow(origin);
        await requestBackend(null, false);
    } catch (error) {
        void recover(error instanceof Error ? error.message : 'Could not start TIGHT.');
    }
}

async function rememberSharing(interactive = true) {
    if (await sharingPreferences.prepareQuit()) return;
    diagnostics.record('sharing.failed');
    if (!interactive) return;
    await dialog.showMessageBox({
        type: 'warning',
        title: 'Wi-Fi sharing could not be remembered',
        message: 'Check Wi-Fi sharing when you reopen TIGHT.',
        detail: 'The network setting could not be saved. Your committed games are saved separately.',
        buttons: ['Quit'],
    });
}

async function exportDiagnostics() {
    let status = { storage: 'unavailable', sharing: 'unknown' };
    try {
        status = await requestBackend(null, false, 'diagnostics');
    } catch {}
    const report = diagnostics.exportReport(
        { app: app.getVersion(), electron: process.versions.electron, node: process.versions.node,
            build: readBuildIdentity(path.join(__dirname, 'build-identity.json')) },
        { backend: backendState, ...status },
    );
    const result = await dialog.showSaveDialog({
        title: 'Export TIGHT diagnostics',
        defaultPath: 'TIGHT-diagnostics.json',
        filters: [{ name: 'JSON diagnostics', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return;
    try {
        await fs.promises.writeFile(result.filePath, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
        diagnostics.record('diagnostics.exported');
    } catch {
        await dialog.showMessageBox({
            type: 'error',
            title: 'Could not export diagnostics',
            message: 'Choose a writable folder and try again.',
        });
    }
}

async function stopForSystemShutdown() {
    if (quitting) return;
    quitting = true;
    await rememberSharing(false);
    await stopBackend();
    diagnostics.record('app.shutdown');
    app.quit();
}

async function requestQuit() {
    if (quitPrompt || quitting) return;
    quitPrompt = true;
    diagnostics.record('app.quit-requested');
    let connectedPlayers;
    try {
        connectedPlayers = (await requestBackend(null, false, 'diagnostics')).connectedPlayers;
    } catch {}
    const options = {
        type: 'question',
        title: 'Close TIGHT?',
        message: 'Close TIGHT and stop hosting?',
        detail: `${Number.isSafeInteger(connectedPlayers) ? `Connected paired player devices: ${connectedPlayers}. ` : ''}Committed games are saved. Players will lose their connection until you reopen TIGHT.`,
        buttons: ['Keep TIGHT open', 'Quit and save'],
        defaultId: 0,
        cancelId: 0,
    };
    const result = await (window && !window.isDestroyed()
        ? dialog.showMessageBox(window, options)
        : dialog.showMessageBox(options));
    quitPrompt = false;
    if (result.response === 1) {
        quitting = true;
        await rememberSharing();
        await stopBackend();
        diagnostics.record('app.shutdown');
        app.quit();
    }
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
    diagnostics.record('app.started');
    app.on('second-instance', () => {
        if (window) {
            if (window.isMinimized()) window.restore();
            window.show();
            window.focus();
        }
    });
    app.on('before-quit', event => {
        if (!quitting) {
            event.preventDefault();
            void requestQuit();
        }
    });
    app.whenReady().then(() => {
        sharingPreferences = createSharingPreferences(sharingPreferencePath(), requestBackend);
        powerMonitor.on('suspend', () => {
            diagnostics.record('app.suspended');
            powerChanges = powerChanges
                .then(async () => {
                    if (!child || quitting) return;
                    const hosting = await requestBackend(null, false);
                    if (hosting.mode === 'lan') await requestBackend(null, true);
                })
                .catch(() => diagnostics.record('sharing.failed'));
        });
        powerMonitor.on('resume', () => {
            diagnostics.record('app.resumed');
            powerChanges = powerChanges
                .then(async () => {
                    if (!child || quitting) return;
                    try {
                        sharingRestoreError = await sharingPreferences.restore();
                        if (sharingRestoreError) throw new Error('Sharing could not resume.');
                    } catch {
                        diagnostics.record('sharing.resume-failed');
                        if (window && !window.isDestroyed())
                            await dialog.showMessageBox(window, {
                                type: 'warning',
                                title: 'Check Wi-Fi sharing',
                                message: 'The shared network changed while this PC was asleep.',
                                detail: 'Open Wi-Fi sharing and choose the current network to reconnect players.',
                            });
                    }
                })
                .catch(() => diagnostics.record('sharing.resume-failed'));
        });
        powerMonitor.on('shutdown', event => {
            event.preventDefault();
            void stopForSystemShutdown();
        });
        ipcMain.handle('tight:hosting', async event => {
            await verifyHostFrame(event);
            return sharingStatus(await requestBackend(null, false));
        });
        ipcMain.handle('tight:set-hosting', async (event, address) => {
            await verifyHostFrame(event);
            if (address !== null && (typeof address !== 'string' || address.length > 64))
                throw new Error('Invalid network selection.');
            try {
                const value = await sharingPreferences.change(address);
                sharingRestoreError = null;
                diagnostics.record(address ? 'sharing.enabled' : 'sharing.disabled');
                return sharingStatus(value);
            } catch (error) {
                diagnostics.record('sharing.failed', errorCode(error));
                throw error;
            }
        });
        session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
        session.defaultSession.setPermissionCheckHandler(() => false);
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const headers = { ...details.responseHeaders };
            if (activeOrigin && new URL(details.url).origin === activeOrigin) {
                headers['Content-Security-Policy'] = [
                    `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ${activeOrigin.replace('http:', 'ws:')}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; frame-src 'none'; form-action 'self'`,
                ];
            }
            callback({ responseHeaders: headers });
        });
        void launch();
    });
    app.on('window-all-closed', () => {
        if (quitting) app.quit();
    });
}
