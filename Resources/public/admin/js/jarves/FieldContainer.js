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

/**
 * This class does only handle field container relationships.
 *
 *
 * @type {Class}
 */
jarves.FieldContainer = new Class({

    fields: {},

    /**
     *
     * @param {jarves.Field} field
     * @param {String} [id]
     */
    addField: function(field, id) {
        this.fields[id || field.getId()] = field;
    },

    /**
     * @param {String} id
     * @returns {jarves.Field}
     */
    getField: function(id) {
        return this.fields[id];
    },

    /**
     * @returns {jarves.Field[]}
     */
    getFields: function() {
        return this.fields;
    },

    /**
     * @param {Object|Array} fields
     */
    setFields: function(fields) {
        this.fields = {};

        if ('object' === typeOf(fields)) {
            this.fields = fields;
        } else if ('array' === typeOf(fields)) {
            Array.each(fields, function(field){
                this.fields[field.getId()] = fieldl
            }.bind(this));
        }
    }

});