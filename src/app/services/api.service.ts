import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from "./storage.service";

@Injectable()
export class ApiService {
    
    baseUrl:string = 'http://geeksioapi-development.azurewebsites.net/api/';
    headers = {
        Authorization : null
    };

  constructor(protected http: HttpClient, private storage: StorageService) {

    //   token.then((token) => {
    //     this.headers.append("Authorization", token);
    //     console.log(token);
    //   })
  }
    
    getBusinessByDomain(domain:string){
        return this.http.get(this.baseUrl + "business/GetBusinessByDomain", {params : {Domain : domain}});
    }

    registerClient(client:any){
        return this.http.post(this.baseUrl + "client/addbusinessclient", client);
    }

    updateClientOnboardingInfo(clientID, machine, isAgentDownloaded, isAgentInstalled){
        return this.http.post(this.baseUrl + "client/updateclientonboardingprocess", null, {params : 
            { 
                Client_ID : clientID,
                Machine_Name: machine,
                isAgentDownloaded: isAgentDownloaded,
                isAgentInstalled: isAgentInstalled
            }
        });
    }

    async getClientInfo(){
        // let token = await this.storage.get("access_token");
        // console.log("token");
        // let headers = null;

        // if(token) {
        //     headers = {
        //         Authorization : token
        //     }
        // }
        // console.log(token);
        return await this.http.get(this.baseUrl + "users/getclient").toPromise();
    }

    getBusinessByID(id){
        return this.http.get(this.baseUrl + "business/getbusinessbyid/" + id);
    }
    
}