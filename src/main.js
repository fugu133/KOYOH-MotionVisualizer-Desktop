'use strict';

const { app, BrowserWindow } = require("electron");

let mainWindow;

//アプリウィンドウの作成
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920, height: 1080, webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            preload: __dirname + '/preload.js'
        }
    });
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.setMenuBarVisibility(false);
}

// 初期化終了後実行
app.on('ready', function () {
    createWindow();
});

// アプリ終了時実行
app.on('window-all-closed', () => {
    // Mac
    if (process.platform !== 'darwin') {
        mainWindow = null;
        app.quit()
    }
});

// アクティブ化実行
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
});