jarves.Fields.Text = new Class({
    Extends: jarves.AbstractFieldType,

    JarvesField: 'text',

    template: 'bundles/jarves/admin/js/views/field.text.html',

    link: function(scope, element, attr) {
        this.attr = attr;
        this.renderTemplateUrl(
            this.template,
            this.beforeCompile.bind(this)
        );
    },

    beforeCompile: function(contents) {
        contents.attr('placeholder', this.attr.placeholder);
        contents.attr('translate', this.attr.translate);
        contents.attr('ng-model', this.attr.model);
    }
});