"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var url = require("url");
var electron_dl_1 = require("electron-dl");
var child_process_1 = require("child_process");
var Shell = require("node-powershell");
var sudo = require("sudo-prompt");
var AutoLaunch = require("auto-launch");
var nodeNotifier = require("node-notifier");
var autoUpdater = require('electron-updater').autoUpdater;
var log = require('electron-log');
var win, serve;
var tray = null;
var ps;
var portalLink = "https://app.geeks.io";
var args = process.argv.slice(1);
serve = args.some(function (val) { return val === '--serve'; });
function createWindow() {
    var electronScreen = electron_1.screen;
    var size = electronScreen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    win = new electron_1.BrowserWindow({
        center: true,
        width: 600,
        height: 700,
        icon: electron_1.nativeImage.createFromPath("./src/assets/images/geeks_icon.ico"),
        webPreferences: {
            nodeIntegration: true,
        },
        frame: false,
        // transparent: true,
        resizable: false
    });
    // Initialize tray
    tray = new electron_1.Tray(electron_1.nativeImage.createFromPath("./src/assets/images/geeks_icon.ico"));
    var contextMenu = electron_1.Menu.buildFromTemplate([
        { label: 'Submit new ticket', click: openPortal },
        { label: 'Logout', click: triggerLogout },
        { label: 'Exit', click: closeApp }
    ]);
    tray.setToolTip('Geeks Support app');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', function () {
        openPortal();
    });
    if (serve) {
        require('electron-reload')(__dirname, {
            electron: require(__dirname + "/node_modules/electron")
        });
        win.loadURL('http://localhost:4200');
        win.webContents.openDevTools();
    }
    else {
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
    // Emitted when the window is closed.
    win.on('closed', function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
        tray.destroy();
    });
    // Function Calls
    enableAutoStartup();
    getBusinessSubdomain();
    // listeners
    electron_1.ipcMain.on('hideWindow', function (event) {
        event.preventDefault();
        showToolTip();
        win.hide();
    });
    electron_1.ipcMain.on('showWindow', function (event) {
        event.preventDefault();
        win.show();
    });
    electron_1.ipcMain.on('downloadFile', downloadAgentHandler);
    electron_1.ipcMain.on('runAgent', installAgentHandler);
    electron_1.ipcMain.on('checkIfAgentInstalled', function (event, setupCheck) { return checkAgentStatus(setupCheck); });
    electron_1.ipcMain.on('minimizeWindow', function (event) { return electron_1.BrowserWindow.getFocusedWindow().minimize(); });
    // ipcMain.on('userLoggedOut', (event) => BrowserWindow.getFocusedWindow().show());
    // setTimeout(() => {
    //   showToolTip();
    // }, 3000);
    // autoUpdater.setFeedURL({ provider: "generic", url:'https://geeksio.visualstudio.com/Geeks-Platform/_git/Geeks-Support-App',
    // token:"f5fbttyqzxkoj6jubwsgerdmvnjp77qglmybxj6bwq6n4hfxgwuq"});
    autoUpdater.checkForUpdates();
}
function openPortal() {
    electron_1.shell.openExternal(portalLink);
}
function triggerLogout() {
    win.webContents.send("logout");
}
function getBusinessSubdomain() {
    electron_1.ipcMain.on("businessDomain", function (event, subdomain) {
        portalLink = "https://" + subdomain + ".geeks.io";
    });
}
function closeApp() {
    tray.destroy();
    electron_1.app.quit();
}
function downloadAgentHandler(event, options) {
    return __awaiter(this, void 0, void 0, function () {
        var win;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    win = electron_1.BrowserWindow.getFocusedWindow();
                    options.props.onProgress = function (status) { return win.webContents.send("downloadInProgress", status); };
                    return [4 /*yield*/, electron_dl_1.download(win, options.url, options.props)
                            .then(function (dl) { return win.webContents.send("downloadCompleted", dl.getSavePath()); })
                            .catch(function (err) { win.webContents.send("downloadFailed", err); console.log(err); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function installAgentHandler(event, filePath) {
    if (process.platform === 'darwin') {
        var path_1 = require('path').dirname(filePath);
        var folderName = require('path').basename(filePath);
        var archiveCommand = 'gunzip -c ' + folderName + ' | tar xopf -';
        // console.log('fulll',archiveCommand)
        child_process_1.exec(archiveCommand, { cwd: path_1 }, function (err, data) {
            if (err) {
                // console.log("unzip ", err);
                win.webContents.send("runAgentDone", { Completed: false, isPremissionGranted: false, error: err });
                return;
            }
            else {
                var options = {
                    name: 'Geeks'
                };
                // let tempp  = "installer -pkg " +  path + '/agent-macosx.pkg  -target /'
                var installCommand = "sh " + path_1 + "/batch-install.sh -P " + path_1 + "/agent-macosx.pkg -T / -s msp.geeks.io -c 'Geeks HQ' -i 100";
                sudo.exec(installCommand, options, function (err, data) {
                    if (err) {
                        // console.error(err);
                        if (err.toString().indexOf("grant permission") > -1) {
                            win.webContents.send("runAgentDone", { Completed: false, isPremissionGranted: false, error: err });
                        }
                        else {
                            win.webContents.send("runAgentDone", { Completed: false, isPremissionGranted: true, error: err });
                        }
                        return;
                    }
                    else {
                        // console.log('workkk')
                        win.webContents.send("runAgentDone", { Completed: true, isPremissionGranted: true, error: null });
                    }
                });
            }
        });
    }
    else {
        child_process_1.execFile(filePath, function (err, data) {
            if (err) {
                // console.error(err);
                win.webContents.send("runAgentDone", { Completed: false, error: err });
            }
            else {
                win.webContents.send("runAgentDone", { Completed: true, error: err });
            }
        });
    }
}
function checkAgentStatus(checkSetup) {
    if (process.platform === 'darwin') {
        child_process_1.exec('system_profiler SPApplicationsDataType', function (err, stdout, stderr) {
            if (err) {
                console.error("exec error: " + err);
                return;
            }
            var result = stdout.search("N-agent");
            // console.log('resss',result)
            if (checkSetup) {
                win.webContents.send("agentCheckResult", { installed: result >= 0 });
            }
            else {
                win.webContents.send("agentStatusCheck", { installed: result >= 0 });
            }
            // console.log(`output ${stdout}`);
        });
    }
    else {
        ps = new Shell({
            executionPolicy: 'Bypass',
            noProfile: true
        });
        ps.addCommand('Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName');
        ps.invoke()
            .then(function (output) {
            // console.log("then");
            // console.log(output);
            var result = output.indexOf("Windows Agent");
            console.log(result);
            if (checkSetup) {
                win.webContents.send("agentCheckResult", { installed: result >= 0 });
            }
            else {
                win.webContents.send("agentStatusCheck", { installed: result >= 0 });
            }
        })
            .catch(function (err) {
            console.log("error");
            console.log(err);
        });
    }
}
function showToolTip() {
    nodeNotifier.notify({
        title: "Geeks Support App",
        message: "You still can use the app while it's running the background",
        icon: "./src/assets/images/logos/geeks-logo-512.png"
    });
    // console.log(notify);
    // notify.show();
    // tray.displayBalloon({
    //   icon: "./src/assets/images/logos/geeks-logo-icon.png",
    //   title: "Geeks app still running",
    //   content: "You are still able to use the application while it's working in the background."
    // });
    // tray.setToolTip("App still working in background");
}
function enableAutoStartup() {
    var autoLaunch = new AutoLaunch({
        name: 'Geeks Support App'
    });
    autoLaunch.enable();
    //autoLaunch.disable();
    autoLaunch.isEnabled()
        .then(function (isEnabled) {
        // console.log("startup", isEnabled);
        if (isEnabled) {
            return;
        }
        autoLaunch.enable();
    })
        .catch(function (err) {
        // handle error
    });
}
//Init
try {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    electron_1.app.on('ready', createWindow);
    // Quit when all windows are closed.
    electron_1.app.on('window-all-closed', function () {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            electron_1.app.quit();
        }
        tray.destroy();
    });
    electron_1.app.on('activate', function () {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    });
}
catch (e) {
    // Catch Error
    // throw e;
}
//-------------------------------------------------------------------
// Auto updates
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');
var sendStatusToWindow = function (text) {
    log.info(text);
    if (win) {
        win.webContents.send('message', text);
    }
};
autoUpdater.on('checking-for-update', function () {
    sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', function (info) {
    sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', function (info) {
    sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', function (err) {
    sendStatusToWindow("Error in auto-updater: " + err.toString());
});
autoUpdater.on('download-progress', function (progressObj) {
    sendStatusToWindow("Download speed: " + progressObj.bytesPerSecond + " - Downloaded " + progressObj.percent + "% (" + progressObj.transferred + " + '/' + " + progressObj.total + " + )");
});
autoUpdater.on('update-downloaded', function (info) {
    sendStatusToWindow('Update downloaded; will install now');
});
autoUpdater.on('update-downloaded', function (info) {
    // Wait 5 seconds, then quit and install
    // In your application, you don't need to wait 500 ms.
    // You could call autoUpdater.quitAndInstall(); immediately
    autoUpdater.quitAndInstall();
});
//# sourceMappingURL=main.js.map