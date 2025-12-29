const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs').promises;

// Function to find available Python command
function findPythonCommand() {
    const commands = process.platform === 'win32'
        ? ['python', 'python3', 'py']
        : ['python3', 'python'];

    return new Promise((resolve, reject) => {
        let tried = 0;

        commands.forEach(cmd => {
            const testProcess = spawn(cmd, ['--version']);

            testProcess.on('close', (code) => {
                tried++;
                if (code === 0) {
                    resolve(cmd);
                } else if (tried === commands.length) {
                    reject(new Error('No Python interpreter found'));
                }
            });

            testProcess.on('error', () => {
                tried++;
                if (tried === commands.length) {
                    reject(new Error('No Python interpreter found'));
                }
            });
        });
    });
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1200,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false,
            enableRemoteModule: false
        },
        titleBarStyle: 'default',
        resizable: true,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#f5f5f5'
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC handlers
ipcMain.handle('select-files', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    
    return result.filePaths;
});

// Handler for selecting multiple folders and reading .txt files from them
ipcMain.handle('select-folders', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'multiSelections'],
        title: 'เลือกโฟลเดอร์ที่มีไฟล์ .txt'
    });

    if (result.canceled || result.filePaths.length === 0) {
        return [];
    }

    const foldersWithFiles = [];

    for (const folderPath of result.filePaths) {
        try {
            const files = await fs.readdir(folderPath);
            const txtFiles = files
                .filter(file => file.toLowerCase().endsWith('.txt'))
                .map(file => path.join(folderPath, file));

            if (txtFiles.length > 0) {
                foldersWithFiles.push({
                    folderPath: folderPath,
                    folderName: path.basename(folderPath),
                    files: txtFiles
                });
            }
        } catch (error) {
            console.error(`Error reading folder ${folderPath}:`, error);
        }
    }

    return foldersWithFiles;
});

ipcMain.handle('process-files', async (event, data) => {
    try {
        // Create temporary JSON file for Python script with proper encoding
        const tempInputFile = path.join(__dirname, '../backend/temp_input.json');
        const jsonString = JSON.stringify(data, null, 2);
        await fs.writeFile(tempInputFile, jsonString, { encoding: 'utf8' });
        
        // Run Python script
        const pythonScript = path.join(__dirname, '../backend/text_processor.py');
        
        return new Promise(async (resolve, reject) => {
            try {
                // Find available Python command
                const pythonCmd = await findPythonCommand();
                const pythonProcess = spawn(pythonCmd, [pythonScript, '--json-input', tempInputFile], {
                    encoding: 'utf8',
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: {
                        ...process.env,
                        PYTHONIOENCODING: 'utf-8',
                        LANG: 'en_US.UTF-8',
                        LC_ALL: 'en_US.UTF-8'
                    }
                });

                let stdout = '';
                let stderr = '';

                pythonProcess.stdout.setEncoding('utf8');
                pythonProcess.stderr.setEncoding('utf8');

                pythonProcess.stdout.on('data', (data) => {
                    stdout += data;
                });

                pythonProcess.stderr.on('data', (data) => {
                    stderr += data;
                });

                pythonProcess.on('close', async (code) => {
                    // Clean up temp file
                    try {
                        await fs.unlink(tempInputFile);
                    } catch (e) {
                        console.error('Failed to delete temp file:', e);
                    }

                    if (code === 0) {
                        try {
                            const result = JSON.parse(stdout);
                            resolve(result);
                        } catch (e) {
                            reject(new Error('Failed to parse Python output: ' + stdout));
                        }
                    } else {
                        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                    }
                });

                pythonProcess.on('error', (error) => {
                    reject(new Error(`Failed to start Python process: ${error.message}`));
                });

            } catch (error) {
                reject(new Error(`Python command not found: ${error.message}`));
            }
        });
        
    } catch (error) {
        throw new Error(`Failed to process files: ${error.message}`);
    }
});

// Handle file path extraction from dropped files
ipcMain.handle('get-file-paths', async (event, fileItems) => {
    // This is a safer way to get file paths from dropped files
    const paths = [];
    for (const item of fileItems) {
        if (item.path && item.name.toLowerCase().endsWith('.txt')) {
            paths.push(item.path);
        }
    }
    return paths;
});

// Handle save preset dialog
ipcMain.handle('save-preset-dialog', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'บันทึก Preset',
        defaultPath: 'text-replacer-presets.json',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    return result.filePath;
});

// Handle open preset dialog
ipcMain.handle('open-preset-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'เปิด Preset',
        properties: ['openFile'],
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    return result.filePaths[0];
});

// Handle write preset file
ipcMain.handle('write-preset-file', async (event, filePath, content) => {
    try {
        await fs.writeFile(filePath, content, { encoding: 'utf8' });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Handle read preset file
ipcMain.handle('read-preset-file', async (event, filePath) => {
    try {
        const content = await fs.readFile(filePath, { encoding: 'utf8' });
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});