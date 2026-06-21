import { Component, inject, OnInit } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MCB_TOOLS_FILE_SERVER_MANAGER_DELETE_FILE, MCB_TOOLS_FILE_SERVER_MANAGER_DOWNLOAD_FILE, MCB_TOOLS_FILE_SERVER_MANAGER_LIST_CATEGORY_FILE, MCB_TOOLS_FILE_SERVER_MANAGER_LIST_FILE_BY_CATEGORY, MCB_TOOLS_FILE_SERVER_MANAGER_WRITE_FILE } from 'src/app/core/constant/api.constant';
import { ModalConfirmationComponent } from 'src/app/shared/component/modal/confirmation/modal-confirmation.component';

@Component({
  selector: 'app-file-server-manager',
  templateUrl: './file-server-manager.component.html',
  styleUrls: ['./file-server-manager.component.css']
})
export class FileServerManagerComponent implements OnInit {
  submissionManagementType : string = "check";
  listCategory : any[] = [];
  category : any;
  response : any = {
    status : null,
    data : null,
    message : null,
    progress: 0
  }

  readonly dialog = inject(MatDialog);

  constructor(private httpClient : HttpClient){}

  ngOnInit(): void {
    this.getListCategory();
  }

  getListCategory(){
    this.response.status = "ON_PROCESS";
    this.response.message = "Loading Category";
    this.response.data = null;
    this.httpClient.get(MCB_TOOLS_FILE_SERVER_MANAGER_LIST_CATEGORY_FILE).subscribe((response : any) =>{
      console.log("success hit service: ", response)
      this.response.status = "SUCCESS";
      this.response.message = "Get Category is Success";
      this.listCategory = response.output_schema;
      this.category = this.listCategory[0];
    }, (error) =>{
      console.error("error hit service: ", error)
      this.response.status = "ERROR";
      this.response.message = `Get Category is Error with error: ${error.message ? error.message :  error.error_schema.error_message.english}`;
    });
  }


  onClickCheckButton(category? : string){
    this.response.status = "ON_PROCESS";
    this.response.message = `Loading List File By Category ${this.category.category}`;
    this.response.data = null;
    let cat = category ? category : this.category.category
    let url = MCB_TOOLS_FILE_SERVER_MANAGER_LIST_FILE_BY_CATEGORY.replace('{category}', cat);
    this.httpClient.get(url).subscribe((response : any) =>{
      console.log("success hit service: ", response)
      this.response.status = "SUCCESS";
      this.response.message = "Get List File is Success";
      this.response.data = {
        listFile: response.output_schema,
        category: JSON.parse(JSON.stringify(this.category))
      };
    }, (error) =>{
      console.error("error hit service: ", error)
      this.response.status = "ERROR";
      this.response.message = `Get List File is Error with error: ${error.message ? error.message :  error.error_schema.error_message.english}`;
      this.response.data = error.output_schema;
    });
  }


  downloadFile(filename : string){
    let url = MCB_TOOLS_FILE_SERVER_MANAGER_DOWNLOAD_FILE.replace("{category}", this.response.data.category.category).replace("{filename}", filename)
    window.open(url, "_blank");
  }
  
  deleteFile(filename : string){
    let dialogConfig = {width: '500px',
        data: {
          title: `Delete Data`,
          message : `Apakah anda ingin menghapus file <b> ${filename} </b>?`
        }
    };
    this.dialog.open(ModalConfirmationComponent, dialogConfig).afterClosed().subscribe((res) =>{
      if(!res)
      {
        return;
      }
      let user : any = localStorage.getItem('user');
      let category  = this.response.data.category.category;
      let url = MCB_TOOLS_FILE_SERVER_MANAGER_DELETE_FILE.replace("{category}", category).replace("{filename}", filename).replace("{user}", user)
      this.response.status = "ON_PROCESS";
      this.response.message = `Deleting File ${filename}`;
      this.response.data = null;
      this.httpClient.delete(url).subscribe((response : any) =>{
        console.log("success hit service: ", response)
        this.response.status = "SUCCESS";
        this.response.message = `Deleting File ${filename} is Success`;
        this.onClickCheckButton(category);
      }, (error) =>{
        console.error("error hit service: ", error)
        this.response.status = "ERROR";
        this.response.message = `Deleting File ${filename} is Error with error: ${error.message ? error.message :  error.error_schema.error_message.english}`;
        this.response.data = null;
      });
    })
  }
  
  uploadFile(file : File){
    let dialogConfig = {width: '500px',
      data: {
        title: `Upload Data`,
        message : `Apakah anda ingin mengupload file <b> ${file.name} </b>?`
      }
    };
    this.dialog.open(ModalConfirmationComponent, dialogConfig).afterClosed().subscribe((res) =>{
      if(!res)
      {
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      let user : any = localStorage.getItem('user');
      let category  = this.response.data.category.category;
      let url = MCB_TOOLS_FILE_SERVER_MANAGER_WRITE_FILE.replace("{category}", category).replace("{user}", user)
      this.response.status = "ON_PROCESS";
      this.response.message = `Uploading File ${file.name}`;
      this.response.data = null;
      this.httpClient.post(url, formData, {reportProgress: true,observe: 'events'}).subscribe((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          console.log('event: ', event);
          if (event.total) {
            this.response.progress = Math.round((event.loaded / event.total) * 100);
          }
        } else if (event.type === HttpEventType.Response) {
          this.response.progress = 0;
          this.response.status = "SUCCESS";
          this.response.message = `Uploading File ${file.name} is Success`;
          this.onClickCheckButton(category);
        }
      }, error => {
        console.error(error);
        this.response.status = "ERROR";
        this.response.message = `Uploading File ${file.name} is Error with error: ${error.message ? error.message :  error.error_schema.error_message.english}`;
        this.response.data = null;
        this.response.progress = 0;
      });
    })


  }
}
