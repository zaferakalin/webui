import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChange,
  OnDestroy
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core'

import { WebSocketService, ShellService } from '../../../services/';
import { TooltipComponent } from '../../common/entity/entity-form/components/tooltip/tooltip.component';
import { T } from '../../../translate-marker';
//import { Terminal } from 'vscode-xterm';
//import * as fit from 'vscode-xterm/lib/addons/fit';
//import * as attach from 'vscode-xterm/lib/addons/attach';
import * as _ from 'lodash';

@Component({
  selector: 'app-jail-shell',
  templateUrl: './jail-shell.component.html',
  styleUrls: ['./jail-shell.component.css'],
  providers: [ShellService],
})

export class JailShellComponent implements OnInit, OnChanges, OnDestroy {
  // sets the shell prompt
  @Input() prompt = '';
  //xter container
  @ViewChild('terminal') container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size: number;
  public token: any;
  public xterm: any;
  private shellSubscription: any;

  public shell_tooltip = T('<b>Ctrl+C</b> kills a foreground process.<br>\
                            Many utilities are built-in:<br> b>Iperf</b>,\
                            <b>Netperf</b>, <b>IOzone</b>, <b>arcsat</b>,\
                            <b>tw_cli</b>, <br><b>MegaCli</b>,\
                            <b>freenas-debug</b>, <b>tmux</b>,\
                            <b>Dmidecode</b>.<br> Refer to the <a\
                            href="..//docs/cli.html"\
                            target="_blank">Command Line Utilities</a>\
                            chapter in the guide for usage information\
                            and examples.');

  clearLine = "\u001b[2K\r"
  protected pk: string;
  protected route_success: string[] = ['jails'];
  constructor(private ws: WebSocketService,
              public ss: ShellService,
              protected aroute: ActivatedRoute,
              public translate: TranslateService,
              protected router: Router) {
                //Terminal.applyAddon(fit);
                //Terminal.applyAddon(attach);
              }

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.getAuthToken().subscribe((res) => {
        this.initializeWebShell(res);
        this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
          if (value !== undefined) {
            this.xterm.write(value);

            if (_.trim(value) == "logout") {
              this.xterm.destroy();
              this.router.navigate(new Array('/').concat(this.route_success));
            }
          }
        });
        this.initializeTerminal();
      });
    });

  }

  ngOnDestroy() {
    if (this.shellSubscription) {
      this.shellSubscription.unsubscribe();
    }
    if (this.ss.connected){
      this.ss.socket.close();
    }
  };

  resetDefault() {
    this.font_size = 14;
  }

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange
  }) {
    const log: string[] = [];
    for (const propName in changes) {
      const changedProp = changes[propName];
      // reprint prompt
      if (propName === 'prompt' && this.xterm != null) {
        this.xterm.write(this.clearLine + this.prompt)
      }
    }
  }

  initializeTerminal() {
    const domHeight = document.body.offsetHeight;
    let rowNum = (domHeight * 0.75 - 104) / 21;
    if (rowNum < 10) {
      rowNum = 10;
    }

    this.xterm = new (<any>window).Terminal({
      'cursorBlink': true,
      'tabStopWidth': 8,
      'cols': 80,
      'rows': parseInt(rowNum.toFixed(), 10),
      'focus': true
    });
    this.xterm.open(this.container.nativeElement);
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.jailId = this.pk;
    this.ss.connect();
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }


}
