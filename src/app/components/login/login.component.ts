import { Component, OnInit, EventEmitter, Input, Output, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { StorageService } from '../../services/storage.service';
import { LoaderService } from '../../services/loader.service';
import { ElectronService } from 'ngx-electron';
import { fadeIn } from '../../animations/animations';
import { fadeInContent } from '@angular/material';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    fadeIn,
    fadeInContent
  ]
})
export class LoginComponent implements OnInit {
  @ViewChild('passwordInput') passInputRef: ElementRef;

  email: string;
  password: string;
  rememberUser: boolean = true;
  appFeatures: Array<string>;
  inputValid: boolean;
  showSignupForm: boolean;
  showOnboarding: boolean;
  showProceedMsg: boolean;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private storage: StorageService,
    private electron: ElectronService,
    private loader: LoaderService,
    private ngZone: NgZone
  ) {
    this.appFeatures = [
      'On-site & Remote Support Access',
      'Feature 2',
      'Feature 3',
      'etc etc ...'
    ];

    this.initilizeLogin();
  }

  async initilizeLogin() {

    // this.loader.showLoader();
    let loggedOut = await this.storage.get('logged_out');
    this.rememberUser = await this.storage.get('remember_user');
    
    if (!loggedOut && this.rememberUser && this.authService.isUserAuthinticated()) {
      // this.login({ email: this.email, password: this.password, rememberUser: this.rememberUser });
      // this.router.navigate(['/onboarding']);
      this.checkOnboarding();
    } else {
      this.rememberUser = true;
    }

  }

  ngOnInit() {

    this.electron.ipcRenderer.on("logout", (event, data) => {
      this.authService.logout();
      this.ngZone.run(() => {
        this.showProceedMsg = false;
        this.showOnboarding = false;
        this.showSignupForm = false;
      });
      this.electron.ipcRenderer.send("showWindow");
    });
    
  }

  async login({ email, password, rememberUser, onboarding }) {
    // this.loadingService.present();
    this.loader.showLoader();

    await this.storage.set('remember_user', rememberUser);
    // await this.storage.set('user_credentials', rememberUser ? { email, password } : null);

    this.authService.login(email, password)
      .then((response: any) => {

        this.authService.getUserInfo(response.access_token).then((user: any) => {
          
          if(onboarding){
            this.showOnboardingComponent();
            this.loader.hideLoader();
          } else {
            this.checkOnboarding();
          }

          this.authService.setUser(user).then(() => {
            // console.log("logggggggged")
            this.authService.handleLoginSuccess(response.id_token, response.refresh_token);
            // this.router.navigate(['/home']);
          });

        });

      })
      .catch((error: any) => {
        // this.loadingService.dismiss();
        this.loader.hideLoader();
        this.toastService.present(error.error.error_description);
        console.error(error);
      });
  }

  facebookLogin() {
    this.authService.facebookLogin();
  }

  hideSignupForm(){
    this.showSignupForm = false;
  }

  showOnboardingComponent(resetSteps?){
    
    if(resetSteps){
      this.storage.remove("onboardingSteps");
    }

    this.showOnboarding = true;
  }

  hideOnboarding()
  {
    this.showOnboarding = false;
    this.showSignupForm = false;
  }

  checkValidity() {
    if (!this.email || !this.password) {
      this.inputValid = false;
    }
    else {
      this.inputValid = true;
    }
  }

  // triggerFacebookLogin() {
  //   this.facebookLogin.emit();
  // }

  triggerLogin() {
    // Force input validation when user doesn't change the input
    this.checkValidity();
    if (this.inputValid) {
      this.login({ email: this.email, password: this.password, rememberUser: this.rememberUser, onboarding: false });
    }
    else {
      this.displayError('Please make sure you have a valid email & password');
    }
  }

  displayError(msg: string) {
    this.toastService.present(msg);
  }

  async checkOnboarding(){
    let steps = await this.storage.get("steps");
    this.loader.showLoader();

    this.electron.ipcRenderer.send("checkIfAgentInstalled", false);

    this.electron.ipcRenderer.on("agentStatusCheck", (event, result) => {
      this.loader.hideLoader();

      this.ngZone.run(() => {
        if(result.installed){
          this.proceedToNext();
        } else {
          this.showOnboardingComponent(true);
        }
      });

    })

  }

  proceedToNext(){
    this.showProceedMsg = true;

    setTimeout(() => {
      this.electron.ipcRenderer.send("hideWindow");
    }, 4000);
  }

  minimizeWindow(){
    this.electron.ipcRenderer.send("minimizeWindow");
  }

  clearStorage(){
    this.storage.clear();
  }


}
