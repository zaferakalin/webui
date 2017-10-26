import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  QueryList,
  ViewChildren
} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
   selector : 'vmware-snapshot-form',
   template : `<entity-form [conf]="this"></entity-form>`
})

export class VMwareSnapshotFormComponent {

  protected resource_name: string = 'storage/snapshot';
  protected route_success: string[] = [ 'storage', 'vmware-Snapshots' ];
  protected isEntity: boolean = true;
  protected isNew: boolean = true;
  protected pk: any;

  protected entityForm: any;
  private datastore: any;

  protected fieldConfig: FieldConfig[];
  public custActions: Array<any> = [
    {
      id : 'FetchDataStores',
      name : 'Fetch DataStores',
      function : () => {
        this.datastore = _.find(this.fieldConfig, {'name' : 'datastore'});
        this.datastore.type = 'select';
        this.datastore.options = [];

        if (
          this.entityForm.formGroup.controls['hostname'].value === undefined ||
          this.entityForm.formGroup.controls['username'].value === undefined ||
          this.entityForm.formGroup.controls['password'].value === undefined
        ) { alert("Please enter valid vmware ESXI/vsphere credentials to fetch datastores.")}
        else {
          const payload = {};
          payload['hostname'] = this.entityForm.formGroup.controls['hostname'].value;
          payload['username'] = this.entityForm.formGroup.controls['username'].value;
          payload['password'] = this.entityForm.formGroup.controls['password'].value;
          this.ws.call("vmware.get_datastores", [payload]).subscribe((res)=>{
            const datastores = res["localhost.localdomain"]
            for (const key in datastores) {
              this.datastore.options.push({label : key, value : key})
            }
          });
        }

       }
    },
  ];


  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef) {}

  preInit(entityForm: any) {
    this.route.params.subscribe(params => { 
      this.pk = params['pk'];
      this.fieldConfig = [
        {
          type: 'input', 
          name: 'hostname', 
          placeholder: 'Hostname',
        },
        {
          type: 'input', 
          name: 'username', 
          placeholder: 'Username',
        },
        {
          type: 'input', 
          name: 'password', 
          placeholder: 'Password',
          inputType: 'password'
        },
        {
          type: 'explorer', 
          name: 'filesystem', 
          placeholder: 'ZFS Filesystem',
          initial: '/mnt'
        },
        {
          type: 'select', 
          name: 'datastore', 
          placeholder: 'Datastore',
        },
      ];
    });
  }
  

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    entityForm.formGroup.controls['password'].valueChanges.subscribe((value)=>{
      // console.log(entityForm.formGroup.controls['password'].value);
      // console.log(entityForm.formGroup.controls['hostname'].value);
      // console.log(entityForm.formGroup.controls['username'].value);
      this.ws.call("vmware.get_datastores",[]);
      //entityForm.formGroup.controls['preview'].setValue(value);
    });
  
  }
}
