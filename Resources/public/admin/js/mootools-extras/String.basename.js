String.implement({
    'basename': function() {
        var lastIndex = this.lastIndexOf('/');
        return this.length && lastIndex > -1 ? this.substr(lastIndex + 1) : '';
    }
});