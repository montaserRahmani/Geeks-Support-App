import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';
import { LoaderService } from '../../services/loader.service';
import { FormGroup, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher, fadeInContent } from '@angular/material';
import { ToastService } from '../../services/toast.service';
import { fadeIn } from '../../animations/animations';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  animations: [
    fadeIn,
    fadeInContent
  ]
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  regex: any = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  business: any;
  loading: boolean;
  checkingEmail: boolean = false;
  businessNotFound: boolean = false;
  callCount: number = 0;
  matcher: CustomErrorStateMatcher;

  @Output() goBack = new EventEmitter<object>();
  @Output() triggerLogin = new EventEmitter<object>();

  constructor(private api: ApiService,
     private auth: AuthService,
      private storage: StorageService,
      private loader:LoaderService,
      private toast:ToastService ) { }

  ngOnInit() {
    this.signupForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.minLength(10)]),
      password: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]),
      passwordConf: new FormControl('', [Validators.required]),
    });

    this.matcher = new CustomErrorStateMatcher();
  }

  checkEmail(){
    if(this.regex.test(this.signupForm.value.email)){
      this.business = null;
      this.businessNotFound = false;
      this.signupForm.controls.email.setErrors(null);
      this.checkingEmail = true;
      this.business = null;
      this.callCount++;
      console.log(this.signupForm.errors, this.signupForm.valid);

      let domain = this.signupForm.value.email.split('@')[1];

      this.api.getBusinessByDomain(domain).subscribe(business => {
        console.log(business);
        this.callCount--;

        if(business){
          this.business = business;
          this.checkingEmail = false;
        } else if(!business && this.callCount == 0) {
          // console.log("in not found");
          this.businessNotFound = true;
          this.signupForm.controls.email.setErrors({'notFound' : true});
          this.signupForm.controls.email.markAsDirty();
          this.signupForm.controls.email.markAsTouched();
          this.checkingEmail = false;
        }

        console.log(this.businessNotFound);
      });
    }
  }

  submitForm(){

    if(!this.signupForm.valid)
      return;

    this.loader.showLoader();

    let client = {
      Name: this.signupForm.value.name + " " + this.signupForm.value.lastName,
      Email: this.signupForm.value.email,
      Phone: this.signupForm.value.phone ? this.signupForm.value.phone : undefined,
      Password: this.signupForm.value.password,
      Business_ID: this.business.Business_ID
    }

    this.storage.set("business", this.business);
    
    this.api.registerClient(client).subscribe(resp => {
      // console.log(resp);
      this.triggerLogin.emit({email: this.signupForm.value.email, password: this.signupForm.value.password, rememberMe: true, onboarding: true});
    }, (err) => {
      this.loader.hideLoader();
      this.toast.present("Couldn't create your account please try again");
    });

  }

  goToLogin() {
    this.goBack.emit();
  }

  checkPasswords() { // here we have the 'passwords' group
    let pass = this.signupForm.controls.password.value;
    let confirmPass = this.signupForm.controls.passwordConf.value;
    if(pass === confirmPass ){
      this.signupForm.controls.passwordConf.setErrors(null);
    } else {
      this.signupForm.controls.passwordConf.setErrors({ notMatching: true });
    }
    this.signupForm.controls.passwordConf.markAsTouched();
    console.log(this.signupForm.controls.passwordConf.errors, this.signupForm.controls.passwordConf.getError("notMatching"), this.signupForm.controls.passwordConf.getError("required"))

  }

  hasError = (controlName: string, errorName: string) =>{
    return this.signupForm.controls[controlName].hasError(errorName);
  }

}


export class CustomErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalidCtrl = !!(control && control.invalid && control.parent.dirty);
    const invalidParent = !!(control && control.parent && control.parent.invalid && control.parent.dirty);

    return (invalidCtrl || invalidParent);
  }
}