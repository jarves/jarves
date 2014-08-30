jarves.Fields.Text = new Class({
    Extends: jarves.AbstractFieldType,

    JarvesDirective: {
        name: 'jarvesField',
        fieldType: 'text',
        options: {
            restrict: 'E',
            controller: true
        }
    },

    link: function(scope, element, attr) {
        this.renderTemplateUrl(
            'bundles/jarves/admin/js/views/field.text.html',
            function beforeCompile(contents){
                contents.attr('placeholder', attr.placeholder);
                contents.attr('translate', attr.translate);
                contents.attr('model', attr.model);
            }
        );
    }
});