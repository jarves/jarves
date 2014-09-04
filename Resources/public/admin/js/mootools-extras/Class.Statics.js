(function() {
    Class.Mutators.Statics = function(properties) {
        if (!this.prototype.Statics) {
            this.prototype.Statics = {};
        }

        Object.each(properties, function(val, key) {
            this[key] = val;
            this.prototype.Statics[key] = val;
        }, this);
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