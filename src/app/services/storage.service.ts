import { LocalStorage } from '@ngx-pwa/local-storage';
import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from 'rxjs';
 
@Injectable()
export class StorageService {
  client = new BehaviorSubject(null);
  business = new BehaviorSubject(null);
 
  constructor(protected localStorage: LocalStorage) {}
    
  async get(key:string){
    return await this.localStorage.getItem(key).toPromise();
  }
  
  async set(key:string, value:any){
    return await this.localStorage.setItem(key, value).toPromise();
  }

  async remove(key:string){
    return await this.localStorage.removeItem(key).toPromise();
  }

  async clear(){
    return await this.localStorage.clear().toPromise();
  }

}