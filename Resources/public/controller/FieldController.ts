import {Inject, angular} from '../angular.ts';

@Inject('$scope, $element, $attrs, $q, backend, objectRepository, jarves')
export default class FieldController {

    public editorOptions = {
        lineWrapping: true,
        lineNumbers: true,
        mode: 'json',
    };

    public definition:Object;
    public json:string;
    public error;
    public value;
    public prettyValue;
    public invalidValue = false;

    constructor($scope, $element, $attrs) {

        var val = '';
        if (!window.localStorage || !(val = window.localStorage.getItem('jarvesbundle_system_dev_fields'))) {
            val = '{\n\
    "label": "Test field",\n\
    "type": "text",\n\
    "desc": "This is a test field."\n\
}';
        }

        this.json = val;

        this.prettyValue = window.localStorage.getItem('jarvesbundle_system_dev_fields_value');
        try {
            this.value = angular.fromJson(this.prettyValue);
        } catch (e) {}

        $scope.$watch(() => { return this.json; }, (value) => {
            try {
                this.definition = angular.fromJson(value);
                window.localStorage.setItem('jarvesbundle_system_dev_fields', value);
            } catch(e) {
                this.definition = null;
                this.error = e;
            }
        });
        $scope.$watch(() => { return this.value; }, (value) => {
            this.prettyValue = angular.toJson(value);
            window.localStorage.setItem('jarvesbundle_system_dev_fields_value', this.prettyValue);
        });
        $scope.$watch(() => { return this.prettyValue; }, (value) => {
            try {
                this.value = angular.fromJson(value);
                this.invalidValue = false;
            } catch (e) {
                this.invalidValue = true;
            }
        });
    }

}