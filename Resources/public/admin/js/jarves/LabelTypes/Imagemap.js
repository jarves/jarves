/*
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

jarves.LabelTypes.Imagemap = new Class({
    Extends: jarves.LabelAbstract,

    options: {
        imageMap: {}
    },

    render: function(values) {
        var value = values[this.fieldId] || '', image;

        if (this.options.imageMap) {
            image = this.options.imageMap[value];
            if ('#' === image.substr(0, 1)) {
                return '<span class="' + jarves.htmlEntities(image.slice(1))+ '"></span>';
            } else {
                return '<img src="' + _path + jarves.htmlEntities(this.options.imageMap[value]) + '"/>';
            }
        }
    }
});