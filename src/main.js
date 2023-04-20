'use strict';

const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require('fs');

let mainWindow;

//アプリウィンドウの作成
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1920, height: 1080, webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: __dirname + '/preload.js'
        }
    });

    mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.setMenuBarVisibility(false);
}

// 初期化終了後実行
app.commandLine.appendSwitch('enable-unsafe-es3-apis');

app.on('ready', function () {
    createWindow();
    ipcMain.handle('import-motion-file', importMotionFile);
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


async function importMotionFile() {
    // モーションファイルを選択
    const paths = dialog.showOpenDialogSync(mainWindow, {
        buttonLabel: 'File import',
        filters: [
            { name: 'JSON', extensions: ['json', 'text'] },
        ],
        properties: [
            'openFile',         // ファイルの選択を許可
            'createDirectory',  // ディレクトリの作成を許可
        ]
    });

    // キャンセルで閉じた場合
    if (paths === undefined) {
        return ({ status: undefined });
    }

    // ファイルの内容を返却
    try {
        const path = paths[0];
        const buff = fs.readFileSync(path, 'utf8');

        return ({
            status: true,
            path: path,
            data: JSON.parse(buff)
        });
    }
    catch (error) {
        return ({ status: false, message: error.message });
    }
}