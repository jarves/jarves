jarves.LabelTypes.Text = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,

    JarvesLabel: 'text',

    link: function(scope, element, attr) {
        var span = angular.element('<span></span>');
        span.attr('ng-bind', this.getModelName());
        this.renderTemplate(span);
    }
});