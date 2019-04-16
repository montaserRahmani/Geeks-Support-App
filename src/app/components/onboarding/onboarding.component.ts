import { Component, OnInit, ChangeDetectorRef, NgZone, ViewEncapsulation } from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { ApiService } from '../../services/api.service';
import { StorageService } from '../../services/storage.service';
import { fadeIn } from '../../animations/animations';
import { fadeInContent } from '@angular/material';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  animations: [
    fadeIn,
    fadeInContent
  ],
  encapsulation: ViewEncapsulation.None
})
export class OnboardingComponent implements OnInit {
  machineName: string;
  agentFilePath: string;
  isMacOs: boolean;
  that:any = this;
  fileNotFound:boolean = false;

  steps:any = {
    step1: {
      current: true,
      downloadProgress: 0,
      downloading: false,
      downloaded: false,
      downloadFailed: false,
      agentStatusUpdated: false,
      agentFilePath: null
    },
    step2: {
      current: false,
      loadingInstaller: false,
      checkingAgent: false,
      agentInstalled: false,
      installFailed: false,
      permissionNotGranted: false,
      agentStatusUpdated: false
    },
    machineNameUpdated: false
  }

  constructor(private electron: ElectronService,
      private ch: ChangeDetectorRef,
      private ngZone: NgZone,
      private api: ApiService,
      private storage: StorageService) { }

  async ngOnInit() {
    
    if(this.electron.remote.process.platform === "darwin"){
      this.isMacOs = true;
    }

    let stepsCache = await this.storage.get("onboardingSteps");
    // console.log(stepsCache);
    // this.storage.remove("onboardingSteps");
    // stepsCache.step1.agentFilePath += "32324"; 
    this.steps = stepsCache || this.steps;

    if(this.steps.step1.downloaded){
      
      setTimeout(() => {
        this.steps.step1.downloaded = false;
        this.steps.step1.current = false;
        this.steps.step2.current = true;
        this.runAgent();
      }, 2000);

    }

    this.updateMachineName();
  }

  async downloadAgent(){
    let business = await this.storage.get("business");
    let url = "https://msp.geeks.io/dms/FileDownload?customerID=" + business.MSP_customerid + "&softwareID=101";
    let mac = "https://msp.geeks.io/dms/FileDownload?customerID=" + business.MSP_customerid + "&softwareID=110";

    if(this.isMacOs){
      url = mac;
    }
    
    this.electron.ipcRenderer.send("downloadFile", {url : url, props: {}});
    this.steps.step1.downloading = true;
    this.fileNotFound = false;

    this.electron.ipcRenderer.on("downloadInProgress", (event, status) => {
      // console.log(event, status);
      this.ngZone.run(() => {
        this.steps.step1.downloadProgress = status * 100;
      });
    });

    this.electron.ipcRenderer.once("downloadFailed", (event, error) => {
      console.log(event, error);
      this.ngZone.run(() => {
        this.steps.step1.downloading = false;
        this.steps.step1.downloadFailed = true;
      });
    });

    this.electron.ipcRenderer.once("downloadCompleted", (event, file) => {
      console.log();
      this.ngZone.run(() => {
        this.steps.step1.agentFilePath = file; // Full file path
        this.steps.step1.downloading = false;
        this.steps.step1.downloaded = true;
        this.updateAgentDownloadedStatus();

        setTimeout(() => {
          this.steps.step1.current = false;
          this.steps.step2.current = true;
          this.runAgent();
        }, 2000);

        this.saveChanges();
      });
    });
  }


  runAgent(){
    this.steps.step2.loadingInstaller = true;
    this.steps.step2.installFailed = false;

    this.electron.ipcRenderer.send("runAgent", this.steps.step1.agentFilePath);

    this.electron.ipcRenderer.once("runAgentDone", (event, response) => {

      console.log(event, response);
      this.steps.step2.loadingInstaller = false;

      if(response.error) {
        this.ngZone.run(() => {
          if(response.error.code === "ENOENT"){
            this.fileNotFound = true;
            this.resetSteps();
          } else {
            this.steps.step2.installFailed = true;
          }
        });
      } else {

        this.ngZone.run(() => {
  
          setTimeout(() => {
            // console.log('check 2')
            this.electron.ipcRenderer.send("checkIfAgentInstalled", true);
          },2000);
  
            this.steps.step2.checkingAgent = true;
  
            this.electron.ipcRenderer.once("agentCheckResult", (event, response) => {
  
              this.ngZone.run(() => {
                if(response.installed){
                  this.steps.step2.checkingAgent = false;
                  this.steps.step2.agentInstalled = true;
                  this.steps.step2.installFailed = false;
                  this.updateAgentInstalledStatus();
                  // this.hideWindow();
                } else {

                  if(response.isPremissionGranted === false) {
                    this.steps.step2.permissionNotGranted = true;
                  }

                  this.steps.step2.checkingAgent = false;
                  this.steps.step2.installFailed = true;
                }
              });
  
              this.saveChanges();
              
            });
        });
      }


    });
  }

  updateMachineName(){
    let os = this.electron.remote.require('os');
    let machine = os.hostname();
    this.steps.machineNameUpdated = true;
    this.updateInfo("machineName", machine);
  }

  updateAgentDownloadedStatus(){
    if(!this.steps.step1.agentStatusUpdated){
      this.updateInfo("downloaded", true);
      this.steps.step1.agentStatusUpdated = true;
      this.saveChanges();
    }
  }

  updateAgentInstalledStatus(){
    if(!this.steps.step2.agentStatusUpdated){
      this.updateInfo("installed", true);
      this.steps.step1.agentStatusUpdated = true;
      this.saveChanges();
    }
  }


  async updateInfo(key, value){
    let info = {
      machineName: null,
      downloaded: null,
      installed: null 
    };

    info[key] = value;

    let client = await this.storage.get("client");

    if(!client){
      this.storage.client.subscribe((clientData:any) => {
        if(clientData) {
          this.api.updateClientOnboardingInfo(clientData.Client_ID, info.machineName, info.downloaded, info.installed).subscribe((response) => {
            console.log(response);
          });
        }
      });
    } else {
      this.api.updateClientOnboardingInfo(client.Client_ID, info.machineName, info.downloaded, info.installed).subscribe((response) => {
        console.log(response);
      });
    }
    // console.log(machine, client);

  }

  hideWindow(){
    setTimeout(() => {
      this.electron.ipcRenderer.send("hideWindow");
    }, 1000);
  }

  saveChanges(){
    this.storage.set("onboardingSteps", this.steps);
  }

  resetSteps(){
    this.steps = {
      step1: {
        current: true,
        downloadProgress: 0,
        downloading: false,
        downloaded: false,
        agentStatusUpdated: false,
        agentFilePath: null
      },
      step2: {
        current: false,
        loadingInstaller: false,
        checkingAgent: false,
        agentInstalled: false,
        installFailed: false,
        permissionNotGranted: false,
        agentStatusUpdated: false
      },
      machineNameUpdated: false
    }

    this.saveChanges();

    // setTimeout(() => {
    //   this.fileNotFound = false;
    // }, 3000);
  }

}
