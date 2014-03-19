String.implement({
    'ucfirst': function(){
        return this.length > 0 ? this.charAt(0).toUpperCase() + (this.length > 1 ? this.substr(1) : '') : '';
    }
});