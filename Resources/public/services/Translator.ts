import {Injectable} from "angular2/core";
import Backend from "./Backend";
import JarvesSession from "./JarvesSession";

@Injectable()
export default class Translator {
    protected translations = null;
    protected translationsLoaded = {};

    constructor(protected backend:Backend, protected jarvesSession:JarvesSession) {
    }

    public loadTranslations() {
        this.backend.get('jarves/admin/ui/language?lang=' + this.jarvesSession.getLanguage(), {})
            .success((response) => {
                this.translations = response.data || {};
            });
    }

    /**
     * Return a translated message with plural and context ability.
     *
     * @param {String} message Message id (msgid)
     * @param {String} plural  Message id plural (msgid_plural)
     * @param {Number} count   the count for plural
     * @param {String} context the message id of the context (msgctxt)
     */
    translate(message:string, plural:string, count:number, context?:string): string {
        if (!this.translationsLoaded[this.jarvesSession.getLanguage()]) {
            this.loadTranslations();
        }

        var id = (!context) ? message : context + "\u0004" + message;

        if (this.translations && this.translations[id]) {
            if (Array.isArray(this.translations[id])) {
                if (count) {
                    var fn = 'gettext_plural_fn_' + this.translations['__lang'];
                    var pluralId = window[fn](count) + 0;

                    if (count && this.translations[id][pluralId]) {
                        return this.translations[id][pluralId].replace('%d', count);
                    } else {
                        return ((count === null || count === false || count === 1) ? message : plural);
                    }
                } else {
                    return this.translations[id][0];
                }
            } else {
                return this.translations[id];
            }
        } else {
            return ((!count || count === 1) && count !== 0) ? message : plural;
        }
    }

    /**
     * sprintf for translations.
     *
     */
    tf():string {
        var args:Array = Array.from(arguments);
        var text:string = args.shift();
        if (typeof text !== 'string') {
            throw 'First argument has to be a string.';
        }

        return this.translate(text.sprintf.apply(text, args));
    }

    /**
     * Return a translated message within a context.
     */
    tc(context:string, message:string) {
        return this.translate(message, null, null, context);
    }

}