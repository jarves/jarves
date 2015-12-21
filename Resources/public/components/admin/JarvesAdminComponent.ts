import {baseUrl, baseUrlApi} from '../../config';
import {Component, HostBinding} from 'angular2/core';
import WindowManagement from '../../services/WindowManagement';
import Jarves from '../../services/Jarves';
import JarvesLoginComponent from "./JarvesLoginComponent";
import {Http, HTTP_PROVIDERS} from 'angular2/http';
import Backend from "../../services/Backend";
import Translator from "../../services/Translator";
import JarvesSession from "../../services/JarvesSession";
import {CORE_DIRECTIVES} from 'angular2/common';
import JarvesConfig from '../../Jarves';
import JarvesTextComponent from "../../fields/JarvesTextComponent";
import BackendLogger from "../../services/BackendLogger";
import JarvesBackendLogsComponent from "./JarvesBackendLogsComponent";
import JarvesInterfaceComponent from "./JarvesInterfaceComponent";

@Component({
    selector: 'jarves-admin',
    providers: [Jarves, WindowManagement, Backend, Translator, JarvesSession, BackendLogger, HTTP_PROVIDERS],
    directives: [JarvesTextComponent, CORE_DIRECTIVES, JarvesLoginComponent, JarvesBackendLogsComponent, JarvesInterfaceComponent],
    template: `
<jarves-login *ngIf="!jarvesSession.isInterfaceVisible()"></jarves-login>
<jarves-interface *ngIf="jarvesSession.isInterfaceVisible()" [class.jarves-white]="jarvesWhite"></jarves-interface>
<jarves-backend-logs [class.jarves-white]="jarvesWhite" [errors]="backendLogger.errors"></jarves-backend-logs>
    `
})
export default class JarvesAdminComponent {

    @HostBinding('class.jarves-admin') protected jarvesAdmin:boolean = true;
    public jarvesWhite:boolean = true;

    constructor(public jarves:Jarves, public jarvesSession:JarvesSession,
                public windowManagement:WindowManagement, public backendLogger: BackendLogger) {
    }

    //showInterface() {
    //    this.windowManagement.restoreWindows();
    //    this.jarvesSession.setInterfaceVisible(true);
    //
    //    this.interfaceVisible = true;
    //
    //    this.windowManagement.activateUrlHashUpdating();
    //}

    logout() {
        this.jarvesSession.setInterfaceVisible(false);
        this.jarvesSession.setSession({});
    }

    loadWindow(entryPoint, options, parentWindowId, isInline) {
        if (!isInline && window.event && window.event.which === 2) {
            //open new tab.
            top.open(location.pathname + '#' + entryPoint.fullPath, '_blank');
            return;
        }

        this.windowManagement.newWindow(entryPoint, options, parentWindowId, isInline);
    }

    getJarves():Jarves {
        return this.jarves;
    }

    /**
     * Opens a entry point. Entry points are REST entry points as well as mapped paths to views in the administration and
     * mapped paths to general functions in the administration. The actual behavior is defined in its `type`.
     * Views can be automatically created CRUD views or custom views. A entry point can also be a function call or a placeholder
     * for grouping.
     *
     * Views will be loaded into a jarves.Window object which are basically just tabs of the main application.
     *
     * @param {String|Object} entryPoint path or entryPoint object
     * @param {Object} [options]
     * @param {Boolean} [inline]
     * @param {Number} [dependWindowId]
     *
     *
     * @return {Number|*} Number when a new View has been loaded or mixed when custom function has been called
     * @throws Error when entryPoint is not found
     */
    openEntryPoint(entryPoint, options, inline, dependWindowId) {
        entryPoint = angular.isObject(entryPoint) ? entryPoint : this.getJarves().getEntryPoint(entryPoint);

        console.log('openEntryPoint', entryPoint);
        if (!entryPoint) {
            throw new Error('Can not be found entryPoint: ' + entryPoint);
        }

        if (-1 !== ['custom', 'iframe', 'list', 'edit', 'add', 'combined'].indexOf(entryPoint.type)) {
            return this.loadWindow(entryPoint, options, dependWindowId, inline);
        } else if (entryPoint.type == 'function') {
            //return jarves.entrypoint.exec(entryPoint, options);
        }
    }
}