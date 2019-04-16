import { app, ipcMain, BrowserWindow, screen, Menu, Tray, shell, nativeImage } from 'electron';
import * as path from 'path';
import * as url from 'url';
import {download} from 'electron-dl';
import {execFile, exec, spawn} from 'child_process';
import * as Shell from 'node-powershell';
import * as  sudo from 'sudo-prompt';
import * as AutoLaunch from 'auto-launch';
import * as nodeNotifier from 'node-notifier';

const {autoUpdater} = require('electron-updater');
const log = require('electron-log');

let win, serve;
let tray = null;
let ps;
let portalLink = "https://app.geeks.io";
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

function createWindow() {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    center: true,
    width: 600,
    height: 700,
    icon: nativeImage.createFromPath("./src/assets/images/geeks_icon.ico"),
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
    // transparent: true,
    resizable: false
  });

  // Initialize tray
  tray = new Tray(nativeImage.createFromPath("./src/assets/images/geeks_icon.ico"));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Submit new ticket', click: openPortal},
    { label: 'Logout', click: triggerLogout},
    { label: 'Exit', click: closeApp}
  ]);
  tray.setToolTip('Geeks Support app');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    openPortal();
  })

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();

  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }


  // Emitted when the window is closed.
  win.on('closed', () => {
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
  ipcMain.on('hideWindow', (event) => {
      event.preventDefault();
      showToolTip();
      win.hide();
  });

  ipcMain.on('showWindow', (event) => {
    event.preventDefault();
    win.show();
  });

  ipcMain.on('downloadFile', downloadAgentHandler);

  ipcMain.on('runAgent', installAgentHandler);

  ipcMain.on('checkIfAgentInstalled', (event, setupCheck) => checkAgentStatus(setupCheck));

  ipcMain.on('minimizeWindow', (event) => BrowserWindow.getFocusedWindow().minimize());

  // ipcMain.on('userLoggedOut', (event) => BrowserWindow.getFocusedWindow().show());

  // setTimeout(() => {
  //   showToolTip();
  // }, 3000);
  // autoUpdater.setFeedURL({ provider: "generic", url:'https://geeksio.visualstudio.com/Geeks-Platform/_git/Geeks-Support-App',
  // token:"f5fbttyqzxkoj6jubwsgerdmvnjp77qglmybxj6bwq6n4hfxgwuq"});
  autoUpdater.checkForUpdates();
}

function openPortal(){
  shell.openExternal(portalLink);
}

function triggerLogout(){
  win.webContents.send("logout");
}

function getBusinessSubdomain(){
  ipcMain.on("businessDomain", (event, subdomain) => {
    portalLink = "https://" + subdomain + ".geeks.io";
  });
}

function closeApp(){
  tray.destroy();
  app.quit();
}

async function downloadAgentHandler(event, options){
  const win = BrowserWindow.getFocusedWindow();

  options.props.onProgress = status => win.webContents.send("downloadInProgress", status);
  
  await download(win, options.url, options.props)
      .then(dl => win.webContents.send("downloadCompleted", dl.getSavePath()))
      .catch(err => {win.webContents.send("downloadFailed", err); console.log(err)});
}

function installAgentHandler(event, filePath){

    if (process.platform === 'darwin') {
       
      let path =  require('path').dirname(filePath);
      let folderName =  require('path').basename(filePath);
      
      let archiveCommand = 'gunzip -c ' + folderName + ' | tar xopf -';
        // console.log('fulll',archiveCommand)
      exec(archiveCommand, {cwd: path}, function(err, data) {

        if(err){
          // console.log("unzip ", err);
          win.webContents.send("runAgentDone", {Completed : false, isPremissionGranted: false, error: err});
          return;

        } else {

          var options = {
            name: 'Geeks'
          };

          // let tempp  = "installer -pkg " +  path + '/agent-macosx.pkg  -target /'
          let installCommand = "sh " + path + "/batch-install.sh -P " + path + "/agent-macosx.pkg -T / -s msp.geeks.io -c 'Geeks HQ' -i 100";

          sudo.exec(installCommand, options, function(err, data) {

            if(err){
              // console.error(err);
              if(err.toString().indexOf("grant permission") > -1){

                win.webContents.send("runAgentDone", {Completed : false, isPremissionGranted: false, error: err});

              } else {

                win.webContents.send("runAgentDone", {Completed : false, isPremissionGranted: true, error: err});
              }
              return;

            } else {
              // console.log('workkk')
              win.webContents.send("runAgentDone", {Completed : true, isPremissionGranted: true, error: null}); 
            }

          });
        }
      });

    } else {

      execFile(filePath, function(err, data) {

        if(err){
          // console.error(err);
          win.webContents.send("runAgentDone", {Completed : false, error: err});
        } else {
          win.webContents.send("runAgentDone", {Completed : true, error: err});
        }

      });

    }

  }

function checkAgentStatus(checkSetup?){
  
  if (process.platform === 'darwin') {
    
    exec('system_profiler SPApplicationsDataType', (err, stdout, stderr) => {

      if (err) {
        console.error(`exec error: ${err}`);
        return;
      }
  
      let result = stdout.search("N-agent");
      // console.log('resss',result)
      if(checkSetup) {
        win.webContents.send("agentCheckResult", {installed : result >= 0});
      } else {
        win.webContents.send("agentStatusCheck", {installed : result >= 0});
      }

      // console.log(`output ${stdout}`);
    });


  } else {

    ps = new Shell({
      executionPolicy: 'Bypass',
      noProfile: true
    });
    
    ps.addCommand('Get-ItemProperty HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* | Select-Object DisplayName');
    ps.invoke()
    .then((output:string) => {
      // console.log("then");
      // console.log(output);
  
      let result = output.indexOf("Windows Agent");
      console.log(result);
      
      if(checkSetup) {
        win.webContents.send("agentCheckResult", {installed : result >= 0});
      } else {
        win.webContents.send("agentStatusCheck", {installed : result >= 0});
      }
      
    })
    .catch(err => {
      console.log("error");
      console.log(err);
    });

  }

}

function showToolTip(){
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

function enableAutoStartup(){
  var autoLaunch = new AutoLaunch({
      name: 'Geeks Support App'
  });
  
  autoLaunch.enable();
  
  //autoLaunch.disable();
  
  autoLaunch.isEnabled()
  .then(function(isEnabled){
    // console.log("startup", isEnabled);
      if(isEnabled){
          return;
      }
      autoLaunch.enable();
  })
  .catch(function(err){
      // handle error
  });
}





//Init

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);


  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }

    tray.destroy();

  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}


//-------------------------------------------------------------------
// Auto updates
//-------------------------------------------------------------------

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');


const sendStatusToWindow = (text) => {
  log.info(text);
  if (win) {
    win.webContents.send('message', text);
  }
};

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});
autoUpdater.on('update-available', info => {
  sendStatusToWindow('Update available.');
});
autoUpdater.on('update-not-available', info => {
  sendStatusToWindow('Update not available.');
});
autoUpdater.on('error', err => {
  sendStatusToWindow(`Error in auto-updater: ${err.toString()}`);
});
autoUpdater.on('download-progress', progressObj => {
  sendStatusToWindow(
    `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred} + '/' + ${progressObj.total} + )`
  );
});
autoUpdater.on('update-downloaded', info => {
  sendStatusToWindow('Update downloaded; will install now');
});

autoUpdater.on('update-downloaded', info => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 500 ms.
  // You could call autoUpdater.quitAndInstall(); immediately
  autoUpdater.quitAndInstall();
});