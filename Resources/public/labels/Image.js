import AbstractLabel from './AbstractLabel.js';
import {Label} from '../angular.js';

@Label('image')
export default class Image extends AbstractLabel {
    // Extends: jarves.LabelTypes.AbstractLabelType,

    // options: {
    //     width: '100%'
    // },

    // Statics: {
    //     options: {
    //         width: {
    //             label: 'Width in px',
    //             type: 'number',
    //             desc: 'Default is 100%'
    //         }
    //     }
    // },

    link(scope, element, attr) {
        // var value = values[this.fieldId] || '';

        // if (!value) {
        //     return '';
        // }

        // var width = this.options.width;
        // var path = _pathAdmin + 'admin/file/preview?' + Object.toQueryString({
        //     path: value,
        //     width: '100%' === width ? null : width
        // });
        // return '<img src="%s" width="%s" />'.sprintf(path, width);
    }
}