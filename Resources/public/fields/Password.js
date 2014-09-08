jarves.Fields.Password = new Class({
    Extends: jarves.Fields.Text,

    JarvesField: 'password',

    beforeCompile: function(contents) {
        this.parent(contents);
        contents.attr('type', 'password');
    }
});