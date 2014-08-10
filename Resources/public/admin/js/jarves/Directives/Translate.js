jarves.Directives.Translate = new Class({

    JarvesDirective: {
        name: 'translate',
        options: ['$parse', 'translator', function($parse, translator){
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    return new jarves.Directives.Translate(scope, element, attrs, translator, $parse);
                }
            }
        }]
    },

    initialize: function(scope, element, attributes, translator, parse) {
        this.scope = scope;
        this.element = element;
        this.translator = translator;
        this.parse = parse;

        this.plural = attributes['translatePlural'];

        if (this.plural) {
            this.scope.$watch(this.plural, this.translate.bind(this));
        }

        this.originText = element.text();
        this.originPlaceholder = element.attr('placeholder');

        this.translator.watch(this.translate.bind(this));

        this.translate();
    },

    translate: function() {
        var translated;

        if (this.originText) {
            translated = this.translator.translate(this.originText, this.parse(this.plural)(this.scope), this.plural);
            if (this.element.text() !== translated) {
                this.element.text(translated);
            }
        }

        if (this.originPlaceholder) {
            translated = this.translator.translate(this.parse(this.originPlaceholder)(this.scope));
            if (this.element.attr('placeholder') !== translated) {
                this.element.attr('placeholder', translated);
            }
        }
    }

});