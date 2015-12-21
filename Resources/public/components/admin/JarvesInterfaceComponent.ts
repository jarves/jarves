import {Component} from 'angular2/core';
import Jarves from "../../services/Jarves";
import JarvesSession from "../../services/JarvesSession";
import WindowManagement from "../../services/WindowManagement";
import IconDirective from "../IconDirective";
import {MapToIterablePipe} from "../../pipes/Object";

@Component({
    selector: 'jarves-interface',
    directives: [IconDirective],
    pipes: [MapToIterablePipe],
    template: `
<div class="jarves-frame">
    <div class="jarves-main-menu-left">
        <div class="jarves-main-menu-logo-container">
            <img class="jarves-main-menu-left-logo" src="{{jarvesSession.baseUrl}}/bundles/jarves/images/logo.png">
        </div>
        <div class="jarves-main-menu-user">
            <div class="jarves-main-menu-user-name">Welcome, {{jarvesSession.session.firstName}} {{jarvesSession.session.lastName}}</div>
        </div>
        <div class="jarves-main-menu-actions"><input class="jarves-Input-text jarves-main-menu-actions-search-input">

            <div class="jarves-main-menu-actions-links"><a>Search</a><a>Wipe Cache</a><a ng-click="logout()">Logout</a></div>
        </div>
        <div class="jarves-main-menu jarves-scrolling">

            <a class="jarves-mainMenu-link" icon="#icon-stats-up" (click)="openDashboard()">Dashboard</a>

            <div *ngFor="#category of jarvesSession.getMenus() | mapToIterable; #i = index" class="jarves-mainMenu-cat"
                 [class.jarves-mainMenu-cat-hidden]="menuHidden[i]">
                <h2 (click)="menuHidden[i] = !!!menuHidden[i]">
                    {{category.label}}
                    <span class="jarves-mainMenu-cat-toggle icon-arrow-down-3" title="Hide"></span>
                </h2>
                <a *ngFor="#link of category.items" class="jarves-mainMenu-link"
                   icon="{{link.icon}}" (click)="openEntryPoint(link.fullPath)">{{link.label}}</a>
            </div>
        </div>
        <div class="jarves-main-menu-bottom">
            <a class="jarves-main-menu-bottom-collapse">Collapse<span class="icon-arrow-left-5"></span></a>
        </div>
    </div>
    <!--<div class="jarves-app-container">-->
        <!--<div class="jarves-desktop">-->
            <!--<jarves-window ng-repeat="windowInfo in windowManagement.activeWindowList" window-info="windowInfo"-->
                           <!--ng-class="{'jarves-Window-inFront': windowInfo.inFront}">-->
            <!--</jarves-window>-->
        <!--</div>-->
        <!--<div class="jarves-main-menu-wm-tabs">-->
            <!--<div ng-repeat="windowInfo in windowManagement.activeWindowList" class="jarves-wm-tab" icon="{{windowInfo.entryPoint.icon}}"-->
                 <!--ng-class="{'jarves-wm-tab-active': windowInfo.inFront}" ng-click="windowManagement.toFront(windowInfo.id)">-->
                <!--{{windowManagement.getWindow(windowInfo.id).getTitle()}}<a class="icon-cancel-8 icon-no-text" ng-click="windowManagement.close(windowInfo.id)"></a>-->
            <!--</div>-->
        <!--</div>-->
    <!--</div>-->
</div>
    `
})
export default class JarvesInterfaceComponent {
    public menuHidden = [];

    constructor(public jarvesSession:JarvesSession, public windowManagement:WindowManagement) {

    }

    public openDashboard() {

    }

    public openEntryPoint() {

    }

    public logout() {

    }
}