jarves.ObjectVersionGraph = new Class({

    Implements: [Options, Events],

    container: null,
    options: {
        object: null //object url
    },

    initialize: function (pContainer, pOptions) {
        this.setOptions(pOptions);
        this.container = pContainer;
        this.loadVersions();
    },

    loadVersions: function () {

        this.container.set('text', t('Loading ...'));

        var objectKey = jarves.getObjectKey(this.options.object);

        this.lr = new Request.JSON({url: _path + 'admin/object-version',
            noCache: true,
            onComplete: function (pResponse) {

            }.bind(this)}).get({uri: this.options.object});

    }




});