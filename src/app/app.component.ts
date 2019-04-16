import { Component } from '@angular/core';
import { ElectronService } from 'ngx-electron';
// import { ElectronService } from './services/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { StorageService } from './services/storage.service';
import { ApiService } from './services/api.service';
import { Router } from '@angular/router';
import { LoaderService } from './services/loader.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  showMainLoader = false;

  constructor(public electron: ElectronService,
    private storage: StorageService,
    private api: ApiService,
    private loader: LoaderService,
    private translate: TranslateService,
    private auth: AuthService,
    private router: Router) {

    translate.setDefaultLang('en');
    // this.electron.ipcRenderer.send("hideWindow");
    // this.storage.clear();

    // console.log('AppConfig', AppConfig);
    if(this.auth.isUserAuthinticated()){
      console.log("authintcated ", this.auth.isUserAuthinticated());
      this.init();
    } else {
      // Listning for the user authentication event
      this.auth.userIsAuthenticated.subscribe((auth) => {
        console.log("inside userIsAuthenticated subscribe", auth);
        if(auth){
          this.init();
          // console.log("authenticated");
        }
      })
    }


  }

  
  async init(){
    // let user = await this.storage.get("user_credentials");
    // this.storage.clear();
    let client = await this.storage.get("client");
    let business = await this.storage.get("business");
    
    if( client === null){
      this.api.getClientInfo().then((response:any) => {
        this.storage.set("client", response);
        this.storage.client.next(response);
        
        if(business === null){
          this.api.getBusinessByID(response.Business_ID).subscribe((biz) => {
            this.storage.set("business", biz);
            this.storage.business.next(biz);
            this.triggerBusinessSubdomain(biz);
          });
        }

      });

    } else {
      this.triggerBusinessSubdomain(business);
    }

  }

  triggerBusinessSubdomain(business){
    console.log(business);
    if(business.BusinessPreferences)
      this.electron.ipcRenderer.send("businessDomain", business.BusinessPreferences.Subdomain);
  }

    // if (electron.isElectron()) {
    //   console.log('Mode electron');
    //   console.log('Electron ipcRenderer', electron.ipcRenderer);
    //   console.log('NodeJS childProcess', electron.childProcess);
    // } else {
    //   console.log('Mode web');
    // }
}
