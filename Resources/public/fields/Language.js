import AbstractFieldType from './AbstractFieldType';
import {Field} from '../annotations';
import {eachValue} from '../utils';
import Select from './Select';

@Field('language')
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