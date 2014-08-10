/*
 * This creates new Mutators at Mootools' Classes to register Controller, Directives, Filter etc
 * to the main jarves angular module.
 */

Class.Mutators.JarvesController = function(controllerName){
    jarves.controller(controllerName, this);
};

Class.Mutators.JarvesService = function(serviceName){
    jarves.service(serviceName, this);
};

Class.Mutators.JarvesFactory = function(name){
    jarves.factory(name, this);
};

Class.Mutators.JarvesFilter = function(name){
    var self = this;
    jarves.filter(name, function() {
        return (new self).filter;
    });
};

Class.Mutators.JarvesDirective = function(definition){
    jarves.directive(
        definition.name,
        'function' === typeOf(definition.options) || 'array' === typeOf(definition.options)
        ? definition.options
        : function(){ return definition.options; }
    );
};