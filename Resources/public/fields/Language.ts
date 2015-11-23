import AbstractFieldType from './AbstractFieldType.t';
import {Field} from '../angular.ts';
import {eachValue} from '../utils.ts';
import Select from './Select.ts';

@Field('language', {
    templateUrl: 'bundles/jarves/views/fields/select.html',
    controllerAs: 'selectController'
})
export default class Language extends Select {

    setupItems() {
        var newItems = {};

        for (let item of eachValue(window.jarves.possibleLangs)) {
            newItems[item.code] = {label: '%s (%s, %s)'.sprintf(item.title, item.code, item.langtitle)};
        }

        this.items = newItems;
        this.updateSelected();
    }
}