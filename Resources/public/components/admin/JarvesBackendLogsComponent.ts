import {Component, Input} from 'angular2/core';
import JarvesSession from "../../services/JarvesSession";
import {BackendLog} from "../../services/BackendLogger";
import JarvesBackendLogDetailComponent from "./JarvesBackendLogDetailComponent";
import {LatestPipe} from "../../pipes/Array";
import {HttpStatusCodeMessagePipe} from "../../pipes/Http";

@Component({
    selector: 'jarves-backend-logs',
    directives: [JarvesBackendLogDetailComponent],
    pipes: [LatestPipe, HttpStatusCodeMessagePipe],
    template: `
<div class="jarves-backend-logs-items selectable" *ngIf="errors.length > 1">
    <div *ngFor="var item of errors|slice:0:-1; #i = index" class="jarves-backend-logs-small-item" [ngClass]="{'active': item.visibleDetails}">
        <a [ngClass]="{'active': item.visibleDetails}" (click)="item.visibleDetails = !item.visibleDetails">
            #{{i + 1}} {{item.title}} - {{item.response.status}} {{item.response.status|httpStatusCodeMessage}}
        </a>
        <jarves-backend-log-detail *ngIf="item.visibleDetails" [index]="i+1" [item]="item"></jarves-backend-log-detail>
    </div>
</div>
<jarves-backend-log-detail *ngIf="errors.length > 0" [index]="errors.length" [item]="errors | latest"></jarves-backend-log-detail>
    `
})
export default class JarvesBackendLogsComponent {
    @Input() public errors:Array<BackendLog> = [];

    constructor(public jarvesSession:JarvesSession) {
    }

    public isSymfonyException(log:BackendLog):boolean {
        return 'error' in log.response.body;
    }

    public getException(log:BackendLog) {

    }
}