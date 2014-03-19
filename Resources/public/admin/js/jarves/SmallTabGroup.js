jarves.SmallTabGroup = new Class({
    Extends: jarves.TabGroup,
    'className': 'jarves-tabGroup-small',

    addButton: function (pTitle, pOnClick, pImageSrc) {

        var button = new Element('a', {
            'class': 'jarves-tabGroup-item gradient',
            title: pTitle,
            text: pTitle
        }).inject(this.box);

        if (pImageSrc) {
            new Element('img', {
                src: pImageSrc
            }).inject(button, 'top');
        }

        this.setMethods(button, pOnClick);
        this.fireEvent('addButton');

        return button;
    }

});