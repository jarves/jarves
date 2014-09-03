jarves.Directives.Translate = new Class({

    Statics: {
        $inject: ['translator', '$parse']
    },

    JarvesDirective: {
        name: 'translate',
        options: {
            restrict: 'A',
            controller: true
        }
    },

    initialize: function(translator, parse) {
        this.translator = translator;
        this.parse = parse;
    },

    link: function(scope, element, attributes) {
        this.scope = scope;
        this.element = element;
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