(function() {
    Class.Mutators.Statics = function(properties) {
        Object.each(properties, function(val, key) {
            this[key] = val;
        }, this);
        this.prototype.Statics = properties;
    };

    var oldExtends = Class.Mutators.Extends;
    Class.Mutators.Extends = function(parent) {
        oldExtends.apply(this, [parent]);
        Object.each(this.prototype.Statics, function(val, key){
            if (!(key in this)) {
                this[key] = val;
            }
        }, this);
    };

})();