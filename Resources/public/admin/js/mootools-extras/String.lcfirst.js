String.implement({
    'lcfirst': function(){
        return this.length > 0 ? this.charAt(0).toLowerCase() + (this.length > 1 ? this.substr(1) : '') : '';
    }
});