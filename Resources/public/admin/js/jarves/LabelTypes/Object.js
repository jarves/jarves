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

jarves.LabelTypes['Object'] = new Class({
    Extends: jarves.LabelAbstract,
    
    options: {
        relationsAsArray: false
    },

    Statics: {
        options: {
            object: {
                label: 'Object key',
                description: 'Example: JarvesBundle:Node.',
                type: 'objectKey',
                required: true
            },
            'objectLabel': {
                needValue: 'object',
                label: t('Object label field (Optional)'),
                description: t('The key of the field which should be used as label.')
            }
        }
    },

    render: function(values) {
        var label, relation, tempValue;
        if (this.fieldId.indexOf('.') > 0) {
            relation = this.fieldId.split('.')[0];
            label = this.fieldId.split('.')[1];
        } else {
            //find label
            var def = jarves.getObjectDefinition(this.getObjectKey());
            label = def.labelField;
        }

        if (typeOf(values[relation]) == 'object') {
            //to-one relation
            tempValue = {};
            if (this.options.relationsAsArray) {
                tempValue[label] = values[relation][label];
                return jarves.htmlEntities(tempValue);
            } else {
                return jarves.htmlEntities(values[relation] ? values[relation][label] : '');
            }
        }
        if (typeOf(values[relation]) == 'array') {
            //to-many relation
            //we join by pField['join'] char, default is ', '
            tempValue = [];
            Array.each(values[relation], function (relValue) {
                tempValue.push(relValue[label]);
            });
            var joined = tempValue.join(this.originField ? this.originField['join'] || ', ' : ', ');
            if (this.options.relationsAsArray) {
                tempValue = {};
                tempValue[label] = joined;
                return jarves.htmlEntities(tempValue);
            } else {
                return jarves.htmlEntities(joined);
            }
        }
    }
});