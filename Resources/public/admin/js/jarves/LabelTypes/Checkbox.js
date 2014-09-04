jarves.LabelTypes.Checkbox = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,

    JarvesLabel: 'checkbox',

    link: function(scope, element, attr) {
        //var value = values[this.fieldId] || '';
        //var clazz = value ? 'icon-checkmark-2' : 'icon-cross';
        //return '<span class="' + clazz + '"></span>';

        this.renderTemplate(
            '<span ng-class="{\'icon-checkmark-2\': %s, \'icon-cross\': !%s}"></span>'
                .sprintf(this.getParentModelName(), this.getParentModelName())
        );
    }
});