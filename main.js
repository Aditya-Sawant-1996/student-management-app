const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const indexCandidates = [
    path.join(process.resourcesPath, 'ui', 'index.html'),
    path.join(
      app.getAppPath(),
      'dist/student-management-app/browser/index.html',
    ),
    path.join(app.getAppPath(), 'dist/student-management-app/index.html'),
  ];

  const indexPath = indexCandidates.find((candidate) =>
    fs.existsSync(candidate),
  );

  if (!indexPath) {
    dialog.showErrorBox(
      'Missing UI files',
      `Could not find the UI entry file. Please rebuild the app before packaging.\n\nChecked:\n${indexCandidates.join('\n')}`,
    );
    return;
  }

  win.loadFile(indexPath);

  if (process.env.ELECTRON_DEV) {
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS recreate window if none open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
