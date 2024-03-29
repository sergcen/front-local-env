import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { release } from 'node:os';
import { join } from 'node:path';
import { update } from './update';
import { hasHost, setHost, unsetHost } from './toggleHosts';
import {
    installPackage,
    listVersions,
    getVersionData,
    installPackageLocal,
} from './registry';
import { localServer } from './localServer';
import { Package } from '../../types/types';
import { DEST_DIR } from './constants';
import * as fs from 'fs';
import { dnsServer } from './dnsServer';

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../');
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST_ELECTRON, '../public')
    : process.env.DIST;

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = join(process.env.DIST, 'index.html');

async function createWindow() {
    win = new BrowserWindow({
        title: 'Main window',
        icon: join(process.env.PUBLIC, 'favicon.ico'),
        width: 1000,
        height: 600,
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        // electron-vite-vue#298
        win.loadURL(url);
        // Open devTool if the app is not packaged
        win.webContents.openDevTools();
    } else {
        win.loadFile(indexHtml);
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send(
            'main-process-message',
            new Date().toLocaleString()
        );
    });

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });

    // Apply electron-updater
    update(win);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows();
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        createWindow();
    }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${url}#${arg}`);
    } else {
        childWindow.loadFile(indexHtml, { hash: arg });
    }
});

ipcMain.on('toggle-hosts', async (e, host) => {
    const isActive = hasHost(host);
    if (!isActive) {
        await setHost(host);
    } else {
        await unsetHost(host);
    }
    win.webContents.send('hosts-active', { [host]: !isActive });
});

ipcMain.handle(
    'getPackageVersion',
    async (event, packageName: string, version: string, registry: string) => {
        return getVersionData(packageName, version, registry);
    }
);

ipcMain.handle(
    'downloadPackageVersion',
    async (event, packageName: string, version: string, registry: string) => {
        return installPackage(packageName, version, registry);
    }
);

ipcMain.handle('installLocalPackage', (event, filePath: string) => {
    return installPackageLocal(filePath);
});
ipcMain.handle('getInstalledVersions', async (event) => {
    return listVersions();
});

ipcMain.handle('startServer', async (event, port: number, pkg?: Package) => {
    return localServer.start({
        port,
        pkgVersion: pkg?.version,
        dir: pkg?.localDir,
        certKey: pkg?.certKey,
        cert: pkg?.cert,
    });
});

ipcMain.handle('stopServer', async (event, port: number, pkgPath: string) => {
    return localServer.stop();
});

ipcMain.handle('getServerStatus', () => {
    return {
        active: localServer.started,
        port: localServer.port,
        pkgVersion: localServer.pkgVersion,
        dir: localServer.currentDir,
    };
});
localServer.on('active', (value: boolean) => {
    win.webContents.send('serverStatus', value);
});

dnsServer.on('active', (value: boolean) => {
    win.webContents.send('DNSServerStatus', value);
});

ipcMain.handle(
    'startDNSServer',
    async (event, domains: string[], target: string) => {
        return dnsServer.startServer(domains, target);
    }
);

ipcMain.handle(
    'stopDNSServer',
    async (event, port: number, pkgPath: string) => {
        return dnsServer.stopServer();
    }
);

fs.mkdirSync(DEST_DIR, { recursive: true });
