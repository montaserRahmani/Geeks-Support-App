import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialsModule } from './modules/materials.module';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AppRoutingModule } from './app-routing.module';
// import { JwtModule } from '@auth0/angular-jwt';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// import { ElectronService } from './services/electron.service';
import { StorageService } from './services/storage.service';
import { ToastService } from './services/toast.service';
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { LoaderService } from './services/loader.service';
import { NgxElectronModule } from 'ngx-electron';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { HttpConfigInterceptor } from './config/http.interceptor';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WebviewDirective,
    OnboardingComponent,
    LoginComponent,
    SignupComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialsModule,
    FlexLayoutModule,
    NgxElectronModule,
    // JwtModule.forRoot({
    //   config: {
    //     // tokenGetter: () => { 
    //     //   // console.log(localStorage.getItem("access_token"))
    //     //   let token = localStorage.getItem("access_token");
    //     //   return token ? token : "";
    //     // },
    //     // whitelistedDomains: ['example.com'],
    //     // blacklistedRoutes: ['example.com/examplebadroute/']
    //   }



    // }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    // ElectronService,
    { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true },
    StorageService,
    ToastService,
    AuthService,
    ApiService,
    LoaderService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(storage: StorageService) {
    
  }

 }
