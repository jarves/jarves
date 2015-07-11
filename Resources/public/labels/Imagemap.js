import AbstractLabel from './AbstractLabel.js';
import {Label} from '../angular.js';

@Label('imageMap')
export default class Imagepmap extends AbstractLabel {
    link(scope, element, attr) {
        // var value = values[this.fieldId] || '', image;

        // if (this.options.imageMap) {
        //     image = this.options.imageMap[value];
        //     if ('#' === image.substr(0, 1)) {
        //         return '<span class="' + jarves.htmlEntities(image.slice(1))+ '"></span>';
        //     } else {
        //         return '<img src="' + _path + jarves.htmlEntities(this.options.imageMap[value]) + '"/>';
        //     }
        // }
    }
}