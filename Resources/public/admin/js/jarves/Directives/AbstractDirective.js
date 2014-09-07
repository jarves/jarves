jarves.Directives.AbstractDirective = new Class({
    initialize: function() {
        var actualArguments = arguments;

        Array.each(this.Statics.$inject, function(name, index) {
            this[name] = actualArguments[index];
        }.bind(this));
    }
});