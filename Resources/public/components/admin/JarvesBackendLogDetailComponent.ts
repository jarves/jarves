import {Component, Input} from 'angular2/core';
import JarvesSession from "../../services/JarvesSession";
import {BackendLog} from "../../services/BackendLogger";
import {HttpStatusCodeMessagePipe} from "../../pipes/Http";

@Component({
    selector: 'jarves-backend-log-detail',
    pipes: [HttpStatusCodeMessagePipe],
    template: `
<div class="jarves-backend-logs-item selectable" *ngIf="item">
    <h3>#{{index}} {{item.title}}</h3>
    <div class="jarves-Backend-Logs-subline">
        {{jarvesSession.baseUrlApi}}{{item.response.request.url}}<br/>
        <span>{{item.reason}}</span>
    </div>
    Response ({{item.response.headers['Content-Type']}}, {{item.response.status}} {{item.response.status|httpStatusCodeMessage}}):
    <div *ngIf="isSymfonyException(item)">
        Exception: {{item.response.body.error}}<br/>
        Message: {{item.response.body.message}}
    </div>
    <a *ngIf="!item.visible" (click)="item.visible = true">Show details</a>
    <a *ngIf="item.visible" (click)="item.visible = false">Hide details</a>
    <div class="jarves-Backend-Logs-message" *ngIf="item.visible">Request:
{{item.response.request.body}}

Response:
{{item.response.originalBody}}</div>
</div>
    `
})
export default class JarvesBackendLogDetailComponent {
    @Input() public item:BackendLog;
    @Input() public index:number;

    constructor(public jarvesSession:JarvesSession) {
    }

    public isSymfonyException(log:BackendLog):boolean {
        if (!log.response.body || typeof log.response.body === 'string') {
            return false;
        }
        return 'error' in log.response.body;
    }
}