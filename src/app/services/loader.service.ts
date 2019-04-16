import { Injectable } from "@angular/core";

@Injectable()
export class LoaderService {
  public showMainLoader = false;

  constructor() { }

  showLoader(){

    if(!document.getElementById("main-loader")){
      let div = document.createElement("div");
      div.setAttribute("class", "geeks-spinner");
      div.setAttribute("id", "main-loader");
      div.innerHTML = `
                      <div class="geeks-wrapper">
                          <div class="geeks-loader"></div>
                      </div>
                  `;
      document.getElementsByTagName("body")[0].appendChild(div);    
    }

  }

  hideLoader(){
    document.getElementById("main-loader").remove();
  }
}