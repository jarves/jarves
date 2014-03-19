jarves.FileTree = new Class({
    Extends: jarves.ObjectTree,

    initialize: function(pContainer, pOptions, pRefs) {
        this.dndOnlyInside = true;
        this.parent(pContainer, pOptions, pRefs);
    },

    addItem: function(pItem, pParent) {
        var a = this.parent(pItem, pParent);
        a.addClass('jarves-files-item');
        a.fileItem = pItem;
    }
});