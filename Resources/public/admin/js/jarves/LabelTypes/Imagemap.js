jarves.LabelTypes.Imagemap = new Class({
    Extends: jarves.LabelTypes.AbstractLabelType,

    options: {
        imageMap: {}
    },

    render: function(values) {
        var value = values[this.fieldId] || '', image;

        if (this.options.imageMap) {
            image = this.options.imageMap[value];
            if ('#' === image.substr(0, 1)) {
                return '<span class="' + jarves.htmlEntities(image.slice(1))+ '"></span>';
            } else {
                return '<img src="' + _path + jarves.htmlEntities(this.options.imageMap[value]) + '"/>';
            }
        }
    }
});