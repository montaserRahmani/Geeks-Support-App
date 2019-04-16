import { Injectable, Injector } from "@angular/core";
import { HttpClient } from '@angular/common/http';
// import { JwtHelperService } from '@auth0/angular-jwt';

import { auth0Config } from "../config/app-settings";
import * as auth0 from 'auth0-js';
// import { LoadingService } from "./loading.service";
import { StorageService } from "./storage.service";
import { BehaviorSubject } from "rxjs";
import { ElectronService } from 'ngx-electron';
import { Router } from "../../../node_modules/@angular/router";

@Injectable()
export class AuthService {
  accessToken: string;
  idToken = new BehaviorSubject(null);
  user = new BehaviorSubject(null);
  baseUrl = "https://geeksioapi-development.azurewebsites.net/api";
  loggedIn = false;
  userIsAuthenticated = new BehaviorSubject(false);
  isTokenValid = new BehaviorSubject(true);

  auth0Client = new auth0.WebAuth({
    clientID: auth0Config.clientId,
    domain: auth0Config.domain,
    responseType: 'token id_token',
    redirectUri: 'http://localhost:8080/callback',
    scope: 'openid profile',
  });

  constructor(
    private storage: StorageService,
    public http: HttpClient,
    // private loading: LoadingService,
    // private jwt: JwtHelperService,
    private electron: ElectronService,
    private router: Router
  ) {
    // this.jwt = new JwtHelperService();
    this.initilizeAuth();
    (window as any).handleOpenURL = (url: string) => {
      this.auth0Client.onRedirectUri(url);
    };
  }

  async initilizeAuth() {
    let idToken = await this.storage.get('access_token');
    console.log(idToken);
    if (idToken) {
      // this.validateToken();
      this.accessToken = idToken;
      let realIDToken = await this.storage.get('id_token');
      this.idToken.next(realIDToken);
      this.userIsAuthenticated.next(true);
      let user = await this.storage.get('user');
      this.user.next(user);
    }
  }

  login(username: string, password: string) {
    return this.http.post(`${auth0Config.baseUrl}/oauth/ro`,
      {
        "username": username,
        "password": password,
        "client_id": auth0Config.clientId,
        "connection": "Username-Password-Authentication",
        "grant_type": "password",
        "scope": "openid profile email address phone"
      }
    ).toPromise();
  }

  getUserInfo(accessToken: string) {
    return this.http.get(`${auth0Config.baseUrl}/userinfo`, {
      params: {
        "access_token": accessToken
      }
    })
      .toPromise()
  }

  facebookLogin() {
    return this.webFBLogin();
  }

  private webFBLogin() {
    return this.auth0Client.authorize({
      connection: 'facebook',
    });
  }

  isUserAuthinticated() {
    return this.idToken.getValue() !== null && this.userIsAuthenticated.getValue();
  }
  

  // validateToken() {
  //   this.isTokenValid.next(!this.jwt.isTokenExpired());
  //   console.log("toke: ", this.jwt.isTokenExpired(), this.jwt);
  //   return !this.jwt.isTokenExpired();
  // }
  

  handleLoginSuccess(idToken, refreshToken) {
    this.loggedIn = true;
    this.userIsAuthenticated.next(true);
    this.accessToken = `Bearer ${idToken}`;
    this.idToken.next(idToken);
    this.storage.set('logged_out', false);
    this.storage.set('access_token', `Bearer ${idToken}`);
    this.storage.set('id_token', idToken);
    this.storage.set('refresh_token', refreshToken);
    // this.sideMenuService.enable();
  }

  setUser(user) {
    this.user.next(user);
    return this.storage.set('user', user)
  }

  registerFacebookUser(data) {
    let body = {
      Email: data.email,
      Name: data.name,
      Pic_URL: data.picUrl,
      Auth0_ID: data.auth0ID,
    };
    return this.http.post(`${this.baseUrl}/client/facebookloginclient`, body)
      .toPromise();
  }

  logout() {
    this.storage.remove('access_token');
    this.storage.remove('id_token');
    this.storage.set('logged_out', true);
    this.storage.remove('refresh_token');
    this.storage.remove('user');
    this.storage.remove('client');
    this.storage.remove('business');
    this.loggedIn = false;
    this.userIsAuthenticated.next(false);
    this.storage.client.next(null);
    this.storage.business.next(null);
    this.accessToken = null;
    this.idToken.next(null);
    this.user.next(null);
    this.electron.ipcRenderer.send("userLoggedOut", null);
    // this.router.navigate(['login']);
    // this.sideMenuService.disable();
  }

}