/*
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

jarves.field_multiUpload = new Class({
    Implements: [Events, Options],
    options: {
        buttontitle: t('Upload new files'),
        uploadpath: 'admin/files/upload',
        deletepath: 'admin/files/deleteFile'
    },

    initialize: function (options, pWin, pParentField) {
        this.setOptions(options);

        this.parentField = pParentField;
        this.parentField.getValue = this.getValue.bind(this);

        this.uploadedFileNum = 0;
        this.uploadedFiles = {};

        this.win = pWin;

        this._renderMultiUpload();
        this._initSWFUpload();

    },

    _renderMultiUpload: function () {

        this.parentField.fieldPanel.setStyle('float', 'left');

        this.parentField.input = new Element('input', {
            'class': 'text multiUpload-firstInput',
            'disabled': 'disabled',
            'type': 'text'
        }).inject(this.parentField.fieldPanel);

        this.uploadBtnId = 'uploadBtn_' + Math.ceil(Math.random() * 100) + '_' + Math.ceil(Math.random() * 100);
        this.uploadBtn = new Element('div', {
            'title': this.options.buttontitle,
            'class': 'jarves-Window-win-buttonWrapper multiUpload-uploadBtnDiv',
            'style': 'background : transparent url(' + _path +
                'bundles/admin/images/admin-files-uploadFile.png) center center no-repeat;cursor:pointer;' }).inject(this.parentField.main);

        new Element('span', { 'id': this.uploadBtnId }).inject(this.uploadBtn);
        new Element('br', { 'style': 'clear:both;'}).inject(this.parentField.main);
        new Element('hr').inject(this.parentField.main);

        this.uploadedFileContainer =
            new Element('div', { 'class': 'multiUpload-fileContainer'}).inject(this.parentField.main);
        this.fireEvent('render', [this.parentField.main, this.uploadedFileContainer]);

    },

    _initSWFUpload: function () {

        jarves.uploads[this.win.id] = new SWFUpload({

            upload_url: _path + this.options.uploadpath + "?" + window._session.tokenid + "=" +
                window._session.sessionid,

            file_post_name: "file",
            flash_url: _path + "admin/swfupload.swf",
            file_upload_limit: "500",
            file_queue_limit: "20",

            file_queued_handler: this._uploadStart.bind(this),

            upload_progress_handler: jarves.fupload._progress,
            upload_error_handler: jarves.fupload.error,
            upload_success_handler: this._uploadSuccess.bind(this),
            upload_complete_handler: this._uploadComplete.bind(this),

            button_placeholder_id: this.uploadBtnId,
            button_width: 26,
            button_height: 20,
            button_text: '<span class="button"></span>',
            button_text_style: '.button { position: absolute; }',
            button_text_top_padding: 0,
            button_window_mode: SWFUpload.WINDOW_MODE.TRANSPARENT,
            button_cursor: SWFUpload.CURSOR.HAND,
            button_action: SWFUpload.BUTTON_ACTION.SELECT_FILES
        });
    },

    _uploadStart: function (pFile) {
        jarves.uploads[this.win.id].removeFileParam(pFile.id, 'path');
        jarves.uploads[this.win.id].addFileParam(pFile.id, 'path', this.options.savepath);
        jarves.uploads[this.win.id].startUpload(pFile.id);
        jarves.fupload.addToUploadMonitor(pFile, jarves.uploads[this.win.id]);
        this.fireEvent('start', [ pFile, jarves.uploads[this.win.id]]);
    },

    _uploadSuccess: function (pFile, pSecParam) {
        jarves.fupload.success(pFile);

        this.fireEvent('success', [pFile, pSecParam]);
        this._addUploadedFileToPanel(pFile, pSecParam);
    },

    _uploadComplete: function (pFile) {
        //upload next file
        jarves.uploads[this.win.id].startUpload();
    },

    _addUploadedFileToPanel: function (pFile, pSecParam) {

        //remove empty icon and class if existing
        if (this.parentField.emptyIcon) {
            this.parentField.emptyIcon.destroy();
        }
        this.parentField.input.set('class', this.parentField.input.retrieve('oldClass'));

        _this = this;
        fileName = pFile.name;
        //if a user function is specified to get the real name then use this
        logger(this.options.fileNameConverter);
        if (this.options.fileNameConverter) {
            try {
                fileName = window[this.options.fileNameConverter](pFile, pSecParam);
            } catch (e) {
                fileName = pFile.name;
            }
        }

        //container for each uploaded file
        new Element('br', { 'style': 'clear:both;'}).inject(this.uploadedFileContainer, 'top');
        fileContainer =
            new Element('div', { 'class': 'multiUpload-fileContainer'}).inject(this.uploadedFileContainer, 'top');
        //name and del btn container
        fileNameDiv = new Element('div', { 'class': 'multiUpload-fileName', 'text': fileName}).inject(fileContainer);

        //delete btn
        var delBtn = new Element('a', {
            href: 'javascript: ;',
            'class': 'multiUpload-delBtn'
        }).inject(fileNameDiv, 'bottom');

        new Element('img', { 'src': _path + 'bundles/jarves/admin/images/icons/cross.png' }).inject(delBtn);
        delBtn.storeKey = 'UFN' + this.uploadedFileNum;
        delBtn.addEvent('click', function () {
            _this.removeUploadedFile(this.storeKey);
        });

        //store information in object
        this.uploadedFiles['UFN' + this.uploadedFileNum] =
        { 'name': fileName, 'fileContainer': fileContainer, childFields: {} };

        //check if the multiupload hast child input elments
        if (this.options.childs) {
            $H(this.options.childs).each(function (pChildVal, pChildKey) {
                if (this.options.small) {
                    pChildVal.small = true;
                }
                this.uploadedFiles['UFN' + this.uploadedFileNum].childFields[pChildKey] =
                    new jarves.Field(pChildVal, pChildKey + '-' + this.uploadedFileNum).inject(fileContainer);
            }.bind(this));
        }

        this.fireEvent('upload', [this.uploadedFileNum, this.uploadedFiles]);
        this.uploadedFileNum++;

    },

    removeUploadedFile: function (pStoreKey) {

        //tooltip
        if (!this.uploadedFiles[pStoreKey].fileContainer.toolTip) {
            this.uploadedFiles[pStoreKey].fileContainer.toolTip =
                new jarves.Tooltip(this.uploadedFiles[pStoreKey].fileContainer, _('Delete ...'));
        }
        this.uploadedFiles[pStoreKey].fileContainer.toolTip.setText(_('Delete ...'));
        this.uploadedFiles[pStoreKey].fileContainer.toolTip.show();

        new Request.JSON({ url: _path + this.options.deletepath,
            onComplete: function (pRes) {
                this.uploadedFiles[pStoreKey].fileContainer.toolTip.destroy();
                this.uploadedFiles[pStoreKey].fileContainer.destroy();
                delete this.uploadedFiles[pStoreKey];

                this.fireEvent('remove', [ pStoreKey, pRes]);

            }.bind(this)
        }).post({ 'path': this.options.savepath, 'name': this.uploadedFiles[pStoreKey].name });

    },

    isEmpty: function () {
        var childsAreEmpty = false;
        if (this.options.empty == false) {

            if ($H(this.uploadedFiles).getKeys().length < 1) {
                this.parentField.empty();
                return true;
            }

            $H(this.uploadedFiles).each(function (pFile) {
                $H(pFile.childFields).each(function (pChild, pChildKey) {
                    if (!pChild.isOk()) {
                        childsAreEmpty = true;
                    }
                });
            });
        }

        return childsAreEmpty;

    },

    getValue: function (pIntern) {
        var res = {};
        var counter = 0;
        $H(this.uploadedFiles).each(function (pFile) {
            if (!res[counter]) {
                res[counter] = {};
            }

            res[counter].name = pFile.name;

            $H(pFile.childFields).each(function (pChild, pChildKey) {
                logger('childKey:' + pChildKey);
                res[counter][pChildKey] = pChild.getValue();
            });
            counter++;
        });
        return res;
    }

});