/*
 * This creates new Mutators at Mootools' Classes to register Controller, Directives, Filter etc
 * to the main jarves angular module.
 */
(function() {
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

    var getInstance = function(klass) {
        klass.$prototyping = true;
        var proto = new klass;
        delete klass.$prototyping;
        return proto;
    };

    Class.Mutators.JarvesDirective = function(definition){
        this.prototype.JarvesDirective = definition;

        if (true === definition.options.controller) {
            definition.options.controller = this;
            definition.options.link = function(scope, element, attr, ctrl) {
                if (!ctrl.isValid) {
                    ctrl.link(scope, element, attr);
                } else if (ctrl.isValid()) {
                    ctrl.link(scope, element, attr);
                }
            };
        }

        var options = 'function' === typeOf(definition.options) || 'array' === typeOf(definition.options)
            ? definition.options
            : function(){ return definition.options; };

        jarves.directive(
            definition.name,
            options
        );
    };
})();