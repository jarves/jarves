jarves.Services.Translator = new Class({
    Statics: {
        $inject: ['$rootScope', '$http']
    },
    JarvesService: 'translator',

    translations: {},
    currentLanguage: 'en',

    initialize: function($rootScope, $http) {
        this.rootScope = $rootScope;
        this.http = $http;
    },

    watch: function(cb) {
        this.rootScope.$watch('jarvesTranslation', cb);
    },

    setLanguage: function(language) {
        this.currentLanguage = language;

        Asset.javascript(_pathAdmin + 'admin/ui/language-plural?lang=' + this.currentLanguage);

        this.http.get(_pathAdmin + 'admin/ui/language?lang=' + this.currentLanguage, {})
            .success(function(response){
                this.rootScope.jarvesTranslation = response.data || {};
            }.bind(this));
    },

    getLanguage: function() {
        return this.currentLanguage;
    },

    /**
     * Return a translated message with plural and context ability.
     *
     * @param {String} message Message id (msgid)
     * @param {String} plural  Message id plural (msgid_plural)
     * @param {Number} count   the count for plural
     * @param {String} context the message id of the context (msgctxt)
     *
     * @return {String}
     */
    translate: function(message, plural, count, context) {
        var id = (!context) ? message : context + "\004" + message;

        if (this.rootScope.jarvesTranslation && this.rootScope.jarvesTranslation[id]) {
            if (typeOf(this.rootScope.jarvesTranslation[id]) == 'array') {
                if (count) {
                    var fn = 'gettext_plural_fn_' + this.rootScope.jarvesTranslation['__lang'];
                    pluralId = window[fn](count) + 0;

                    if (count && this.rootScope.jarvesTranslation[id][pluralId]) {
                        return this.rootScope.jarvesTranslation[id][pluralId].replace('%d', count);
                    } else {
                        return ((count === null || count === false || count === 1) ? message : plural);
                    }
                } else {
                    return this.rootScope.jarvesTranslation[id][0];
                }
            } else {
                return this.rootScope.jarvesTranslation[id];
            }
        } else {
            return ((!count || count === 1) && count !== 0) ? message : plural;
        }
    },

    /**
     * sprintf for translations.
     *
     * @return {String}
     */
    tf: jarves.tf = function() {
        var args = Array.from(arguments);
        var text = args.shift();
        if (typeOf(text) != 'string') {
            throw 'First argument has to be a string.';
        }

        return text.sprintf.apply(text, args);
    },

    /**
     * Return a translated message within a context.
     *
     * @param {String} context the message id of the context
     * @param {String} message message id
     */
    tc: jarves.tc = function(context, message) {
        return t(message, null, null, context);
    }

});