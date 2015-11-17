import {Directive, Inject} from '../angular.ts';
import {each, eachValue} from '../utils.ts';

@Directive('jarvesFormGroup', {
    restrict: 'E',
    scope: {
        'fields': '=',
        'model': '='
    },
    require: ['jarvesFormGroup'],
})
export default class JarvesFormGroup {

    public fields = {};
    public editController;

    constructor(private $scope, private $element, private $attrs, private $compile, private $interpolate) {
    }

    getName() {
        return this.$attrs.name ? this.$interpolate(this.$attrs.attrs)(this.$scope) : '';
    }

    isValid(highlight) {
        var valid = true;
        for (let field of eachValue(this.fields)) {
            if (!field.isValid(highlight)) {
                valid = false;
            }
        }

        return valid;
    }

    link(scope, element, attributes, controllers) {

        // if (controllers[1]) {
        //     this.formController = controllers[1];

        //     if (this.formController) {
        //         this.formController.addFormGroup(this.getName(), this);
        //     }
        // }

        this.$scope.$parent.$watch(attributes.fields, (fields) => {
            var xml = this.buildXml(fields, 'fields');
            this.$element.html(xml);
            this.$compile(this.$element.contents())(this.$scope);
        });
    }

    buildXml(fields, parentModelName, depth = 0) {
        var xml = [];

        var spacing = ' '.repeat(depth * 4);

        for (let [id, field] of each(fields)) {
            field.id = field.id || id;

            var modelName = parentModelName + '.' + id;

            var line = spacing + '<jarves-field definition="%s">\n'.sprintf(modelName);
            if (field.children) {
                line += this.buildXml(field.children, modelName + '.children', depth + 1);
            }
            line += spacing + '</jarves-field>\n';
            xml.push(line);
        }

        return xml.join("\n");
    }
}