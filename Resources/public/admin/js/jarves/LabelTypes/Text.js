jarves.LabelTypes.Text = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,

    JarvesLabel: 'text',

    link: function(scope, element, attr) {
        var span = angular.element('<span></span>');
        span.attr('ng-bind', '$parent.' + attr.data + '.' + this.getOption('id'));

        console.log('link text label', attr, span);
        this.renderTemplate(span);
    }
});