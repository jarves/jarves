jarves.MultiValue = new Class({
    mainValue: null,
    additionalValues: {},

    initialize: function(mainValue, additionalValues) {
        this.mainValue = mainValue;
        this.additionalValues = typeOf(additionalValues) === 'object' ? additionalValues : {};
    }
});