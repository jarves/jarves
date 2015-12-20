import {Injectable} from "angular2/core";

interface Settings {
}

interface Session {
    userId:number;
    access:boolean;
    sessionId:string;
    tokenId:string;
    lang: string;
}

@Injectable()
export default class JarvesSession {

    protected language:string = 'en';
    protected settings:Settings = {};
    protected session:Session;
    protected interfaceVisible:boolean = false;

    public baseUrl:string = './';
    public baseUrlApi:string = './';

    constructor(){
        this.session = window['_session'];
        this.baseUrl = window['_baseUrl'];
        this.baseUrlApi = window['_baseUrlApi'];
    }

    public isInterfaceVisible():boolean {
        return this.interfaceVisible;
    }

    public setInterfaceVisible(visible:boolean) {
        this.interfaceVisible = visible;
    }

    public getLanguage():string {
        return this.language;
    }

    public setLanguage(language:string) {
        this.language = language;
    }

    public getSettings():Settings {
        return this.settings;
    }

    public setSettings(settings:Settings) {
        this.settings = settings;
    }

    public isLoggedIn():boolean {
        return this.session.userId > 0;
    }

    public getSession():Session {
        return this.session;
    }

    public setSession(session:Session) {
        this.session = session;
    }
}