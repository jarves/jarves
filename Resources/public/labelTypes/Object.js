jarves.LabelTypes['Object'] = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,
    
    //options: {
    //    relationsAsArray: false
    //},

    JarvesLabel: 'object',

    //Statics: {
    //    options: {
    //        object: {
    //            label: 'Object key',
    //            desc: 'Example: JarvesBundle:Node.',
    //            type: 'objectKey',
    //            required: true
    //        },
    //        'objectLabel': {
    //            needValue: 'object',
    //            label: 'Object label field (Optional)',
    //            desc: 'The key of the field which should be used as label.'
    //        }
    //    }
    //},


    link: function(scope, element, attr) {
        var span = angular.element('<span ng-bind="label"></span>');
        var id = this.getOption('id');
        var label, relation, tempValue, joined;

        relation = id.split('.')[0];
        label = id.split('.')[1];

        var modelName = attr.data +'.'+ relation;

        var joinChar = this.getOption('join') ? this.getOption('join') || ', ' : ', ';

        scope.$parent.$watch(modelName, function(values) {
            if (typeOf(values) == 'array') {
                //to-many relation
                //we join by pField['join'] char, default is ', '
                tempValue = [];
                Array.each(values, function (relValue) {
                    tempValue.push(relValue[label]);
                });
                joined = tempValue.join(joinChar);
                if (this.options.relationsAsArray) {
                    tempValue = {};
                    tempValue[label] = joined;
                    scope.label = tempValue;
                } else {
                    scope.label = joined;
                }
            }

            if (typeOf(values) == 'array') {
                //to-many relation
                //we join by pField['join'] char, default is ', '
                tempValue = [];
                Array.each(values, function (relValue) {
                    tempValue.push(relValue[label]);
                });
                joined = tempValue.join(joinChar);
                if (this.options.relationsAsArray) {
                    tempValue = {};
                    tempValue[label] = joined;
                    scope.label = tempValue;
                } else {
                    scope.label = joined;
                }
            }
        }.bind(this));

        //span.attr('ng-bind', '$parent.' + attr.data + '.' + this.getOption('id'));
        this.renderTemplate(span);
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