Class.Mutators.Statics = function(properties){
    Object.each(properties, function(prop, key) {
        this[key] = prop;
    }, this);
};