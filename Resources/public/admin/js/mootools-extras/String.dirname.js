String.implement({
    'dirname': function() {
        var lastIndex = this.lastIndexOf('/');
        return this.length && lastIndex > -1 ? this.substr(0, lastIndex) : '';
    }
});