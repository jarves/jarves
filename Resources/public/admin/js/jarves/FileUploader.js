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

jarves.FileUploader = new Class({
    uploadTrs: {},
    uploadFilesCount: 0,
    uploadFileNames: {},
    fileUploadSpeedLastCheck: 0,
    fileUploadedSpeedLastLoadedBytes: 0,
    fileUploadedLoadedBytes: 0,
    fileUploadSpeedLastByteSpeed: 0,
    fileUploadSpeedInterval: false,

    html5UploadXhr: {},
    html5FileUploads: {},

    callbacks: {},
    fileWatcher: {},

    initialize: function() {

    },

    /**
     * @param {Object} pFile
     * @param {Function} cb
     *
     * @returns {jarves.FileUploadWatcher}
     */
    newFileUpload: function(pFile, cb) {
        if (!pFile.id) {
            pFile.id = 'HTML5_' + Object.getLength(this.html5FileUploads);
        }

        var fileUploaderWatcher = new jarves.FileUploadWatcher(pFile);

        if (pFile.html5) {
            this.html5FileUploads[pFile.id] = pFile;
        }

        if (cb) {
            this.callbacks[pFile.id] = cb;
        }

        this.fileWatcher[pFile.id] = fileUploaderWatcher;

        this.prepareDialog();

        this.fileUploadMinimizeBtn.show();
        this.fileUploadCancelBtn.setText(t('Cancel'));

        this.uploadFilesCount++;

        var tr = new Element('tr').inject(this.fileUploadTBody);

        var td = new Element('td', {
            width: 20,
            style: 'color: gray',
            text: '#' + this.uploadFilesCount
        }).inject(tr);

        tr.name = new Element('td', {
            text: pFile.name
        }).inject(tr);

        var td = new Element('td', {
            width: 60,
            style: 'text-align: center; color: gray;',
            text: jarves.bytesToSize(pFile.size)
        }).inject(tr);

        tr.status = new Element('td', {
            text: t('Pending ...'),
            width: 250,
            style: 'text-align: center;'
        }).inject(tr);

        var td = new Element('td', {
            width: 150
        }).inject(tr);

        tr.progress = new jarves.Progress();
        document.id(tr.progress).inject(td);
        document.id(tr.progress).setStyle('width', 132);

        tr.deleteTd = new Element('td', {
            width: 20
        }).inject(tr);

        new Element('img', {
            src: _path + 'bundles/jarves/admin/images/icons/delete.png',
            style: 'cursor: pointer;',
            title: _('Cancel upload')
        }).addEvent('click', function() {
                this.cancelUpload(pFile.id, true);
            }.bind(this)).inject(tr.deleteTd);

        this.uploadTrs[ pFile.id ] = tr;
        this.uploadTrs[ pFile.id ].file = pFile;

        if (pFile.html5) {
            if (!pFile.post) {
                pFile.post = {};
            }

            pFile.post.path = pFile.target;
        } else {
//            jarves.uploads[this.win.id].addFileParam(pFile.id, 'path', pFile.target);
        }

        (function() {
            if (jarves.settings.upload_max_filesize && jarves.settings.upload_max_filesize < pFile.size) {
                this.uploadError(pFile);
            } else {

                if (pFile.html5) {
                    this.fileUploadCheck(this.html5FileUploads[ pFile.id ]);
                } else {
                    //this.fileUploadCheck(jarves.uploads[this.win.id].getFile(pFile.id));
                }
            }
        }.bind(this)).delay(50);

        this.uploadAllProgress();

        return fileUploaderWatcher;
    },

    prepareDialog: function() {
        if (!this.dialog) {
            this.dialog = new jarves.SystemDialog(null, {
                autoClose: true
            });

            new Element('h1', {
                text: tc('fileUpload', 'Uploads')
            }).inject(this.dialog.getContentContainer());

            this.dialog.topBar = new Element('div', {
                'class': 'jarves-FilesUpload-topBar'
            }).inject(this.dialog.getContentContainer());

            this.fileUploadCancelBtn = new jarves.Button(t('Clear')).addEvent('click', this.clear.bind(this)).inject(this.dialog.topBar);

            this.fileUploadCancelBtn = new jarves.Button(t('Cancel All')).addEvent('click', function(){
                this.cancelUploads(true);
            }.bind(this)).inject(this.dialog.topBar);

            this.fileUploadMinimizeBtn = new jarves.Button(t('Minimize')).addEvent('click', this.minimizeUpload.bind(this)).inject(this.dialog.topBar);

            var table = new Element('table', {style: 'width: 100%;', 'class': 'jarves-file-uploadtable'}).inject(this.dialog.content);
            this.fileUploadTBody = new Element('tbody').inject(table);

            this.dialog.topBarLeft = new Element('div', {
                'class': 'jarves-FilesUpload-topBarLeft'
            }).inject(this.dialog.topBar);

            this.fileUploadDialogProgress = new jarves.Progress();
            document.id(this.fileUploadDialogProgress).inject(this.dialog.topBarLeft);
            document.id(this.fileUploadDialogProgress).setStyle('width', 132);
            document.id(this.fileUploadDialogProgress).setStyle('display', 'inline-block');

            this.fileUploadDialogAll = new Element('div', {
                style: 'color: gray;'
            }).inject(this.dialog.topBarLeft);

            this.fileUploadDialogAllText = new Element('span').inject(this.fileUploadDialogAll);
            this.fileUploadDialogAllSpeed = new Element('span').inject(this.fileUploadDialogAll);

            new Element('div', {
                'class': 'jarves-clear'
            }).inject(this.dialog.topBar);
        }
    },

    showDialog: function() {
        this.dialog.center();
    },

    toggleDialog: function() {
        if (this.dialog) {
            if (this.dialog.isOpen()) {
                this.dialog.close();
            } else {
                this.dialog.show();
            }
        }
    },

    minimizeUpload: function() {
        this.dialog.close();
    },

    fileUploadCheck: function(pFile) {
        var name = pFile.name;

        this.uploadTrs[ pFile.id ].status.set('html', ('Pending ...'));

        if (this.uploadTrs[ pFile.id ].rename) {
            this.uploadTrs[ pFile.id ].rename.destroy();
            delete this.uploadTrs[ pFile.id ].rename;
        }

        if (pFile.post && pFile.post.name && name != pFile.post.name) {
            name = pFile.post.name;

            this.uploadTrs[ pFile.id ].rename = new Element('div', {
                style: 'color: gray; padding-top: 4px;',
                text: '-> ' + name
            }).inject(this.uploadTrs[ pFile.id ].name);
        }

        var overwrite = (pFile.post.overwrite == 1) ? 1 : 0;

        new Request.JSON({url: _pathAdmin + 'admin/file/upload/prepare', noCache: 1,
            onComplete: function(pResponse) {

                var res = pResponse.data;

                if (res.renamed) {
                    if (this.uploadTrs[ pFile.id ].rename) {
                        this.uploadTrs[ pFile.id ].rename.destroy();
                    }
                    this.uploadTrs[ pFile.id ].rename = new Element('div', {
                        style: 'color: gray; padding-top: 4px;',
                        text: '-> ' + res.name
                    }).inject(this.uploadTrs[ pFile.id ].name);

                    if (pFile.html5) {
                        this.html5FileUploads[ pFile.id ].post.name = res.name;
                    } else {
//                        jarves.uploads[this.win.id].addFileParam(pFile.id, 'name', res);
                    }
                    this.fileWatcher[pFile.id].rename(res.name);
                }

                if (res.exist) {
                    this.showDialog();
                    this.uploadTrs[ pFile.id ].status.set('html', '<div style="color: red">' + _('Filename already exists') + '</div>');

                    this.uploadTrs[ pFile.id ].needAction = true;

                    new jarves.Button(t('Rename')).addEvent('click', function() {

                        this.win._prompt(t('New filename'), name, function(res) {

                            if (res) {

                                this.uploadTrs[ pFile.id ].needAction = false;

                                if (pFile.html5) {
                                    this.html5FileUploads[ pFile.id ].post.name = res;
                                    this.fileUploadCheck(this.html5FileUploads[ pFile.id ]);
                                } else {
//                                    jarves.uploads[this.win.id].addFileParam(pFile.id, 'name', res);
//                                    this.fileUploadCheck(jarves.uploads[this.win.id].getFile(pFile.id));
                                }
                            }

                        }.bind(this));

                    }.bind(this)).inject(this.uploadTrs[ pFile.id ].status);

                    new jarves.Button(_('Overwrite')).addEvent('click', function() {

                            this.uploadTrs[ pFile.id ].needAction = false;

                            if (pFile.html5) {
                                this.html5FileUploads[ pFile.id ].post.overwrite = 1;
                                this.fileUploadCheck(this.html5FileUploads[ pFile.id ]);
                            } else {
//                                jarves.uploads[this.win.id].addFileParam(pFile.id, 'overwrite', '1');
//                                this.fileUploadCheck(jarves.uploads[this.win.id].getFile(pFile.id));
                            }
                        }.bind(this))

                        .inject(this.uploadTrs[ pFile.id ].status);

                    this.uploadCheckOverwriteAll();

                } else if (res.ready) {
                    this.fileWatcher[pFile.id].ready(res);
                    if (pFile.html5) {
                        this.startHtml5Upload(pFile.id);
                    } else {
//                        jarves.uploads[this.win.id].startUpload(pFile.id);
                    }
                }

            }.bind(this)}).post({
                path: pFile.post.path,
                name: name,
                overwrite: overwrite,
                autoRename: pFile.autoRename
            });
    },

    startHtml5Upload: function(pFileId) {
        var file = this.html5FileUploads[ pFileId ];

        var xhr = new XMLHttpRequest();

        this.html5UploadXhr[ pFileId ] = xhr;

        if (xhr.upload) {
            xhr.upload.addEventListener("progress", function(pEvent) {
                this.uploadProgress(file, pEvent.loaded, pEvent.total);
            }.bind(this), false);

            xhr.onreadystatechange = function(e) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        this.uploadComplete(file);
                    } else {
                        this.uploadError(file, xhr.responseText);
                    }
                }
            }.bind(this);

            if (!file.post) {
                file.post = {};
            }
            xhr.onerror = function(e) {
                this.uploadError(file);
            }.bind(this);

            this.uploadStart(file);

            file.post[window._session.tokenid] = window._session.sessionid;
            var url = _pathAdmin + "admin/file/upload";
            xhr.open('POST', url, true);

            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            var formData = new FormData();
            formData.append('file', file);
            Object.each(file.post, function(value, key) {
                formData.append(key, value);
            });
            xhr.send(formData);
        }
    },

    uploadCheckOverwriteAll: function() {

        var needButton = false;
        var countWhichNeedsAction = 0;
        Object.each(this.uploadTrs, function(tr, id) {
            if (tr.file && tr.needAction == true) {
                countWhichNeedsAction++;
            }
        }.bind(this));

        if (countWhichNeedsAction > 1) {
            if (!this.uploadOverwriteAllButton) {
                this.uploadOverwriteAllButton = new jarves.Button(_('Overwrite all')).addEvent('click', function() {

                    Object.each(this.uploadTrs, function(tr, id) {

                        tr.needAction = false;

                        if (tr.file.html5) {
                            this.html5FileUploads[ tr.file.id ].post.overwrite = 1;
                            this.fileUploadCheck(this.html5FileUploads[  tr.file.id ]);
                        } else {
//                            jarves.uploads[this.win.id].addFileParam(tr.file.id, 'overwrite', '1');
//                            this.fileUploadCheck(jarves.uploads[this.win.id].getFile(tr.file.id));
                        }

                    }.bind(this));

                    document.id(this.uploadOverwriteAllButton).destroy();
                    delete this.uploadOverwriteAllButton;

                }.bind(this)).inject(this.dialog.topBar, 'top');
            }
        }

    },

    uploadNext: function() {
        var found = false;
        Object.each(this.uploadTrs, function(file, id) {
            if (!found && file && !file.needAction && !file.complete && !file.error) {
                found = file;
            }
        }.bind(this));

        if (found) {

            if (found.file.html5) {
                this.startHtml5Upload(found.file.id);
            } else {
//                jarves.uploads[this.win.id].startUpload(found.file.id);
            }

        }
    },

    uploadAllProgress: function() {
        var count = 0;
        var loaded = 0;
        var all = 0;
        var done = 0;
        var failed = 0;

        Object.each(this.uploadTrs, function(tr, id) {
            if (!tr.canceled) {
                count++;
            }

            if (!tr.canceled && !tr.error) {
                if (tr.loaded) loaded += tr.loaded;
                if (tr.error) all += tr.file.size;
                ;
            }

            if (tr.complete == true) {
                done++;
            }

            if (tr.error == true) {
                failed++;
            }
        });

        var allDone = done == count;

        this.fileUploadDialogAllText.set('text', _('%s done').replace('%s', done + '/' + count) + '.');

        this.fileUploadedTotalBytes = all;
        this.fileUploadedLoadedBytes = loaded;
        this.fileUploadCalcSpeed();

        var percent = count > 0 ? Math.ceil((loaded / all) * 100) : 0;
        if (count && done == count) {
            percent = 100;
        }
        this.fileUploadDialogProgress.setValue(percent);

        this.updateSmallProgressBar(done + failed, count, loaded, all);
    },

    updateSmallProgressBar: function(uploadedCount, maxCount, uploadedBytes, allBytes) {
        if (this.smallProgressBarHiderTimeout) {
            clearTimeout(this.smallProgressBarHiderTimeout);
        }

        if (!this.smallProgressBar) {
            this.smallProgressBar = new Element('div', {
                'class': 'jarves-FileUploader-smallProgressBar'
            }).inject(jarves.getAdminInterface().mainMenuUser, 'after');

            this.smallProgressBar.addEvent('click', this.toggleDialog.bind(this));
        } else if (this.smallProgressBar.getStyle('opacity') != 1) {
            this.smallProgressBar.tween('opacity', 1);
        }

        var percent = Math.ceil((uploadedCount / maxCount) * 100);
        var speed = this.fileUploadCalcSpeed(true);
        if (!speed) {
            speed = ' -- KB/s';
        } else {
            speed = ' ' + jarves.bytesToSize(speed) + '/s';
        }

        var text = tf('Uploading %s/%s (%s%%) %s', uploadedCount, maxCount, percent, speed);
        if (uploadedCount == maxCount) {
            text = t('Files uploaded.');
            this.smallProgressBarHiderTimeout = (function() {
                if (this.smallProgressBar) {
                    this.smallProgressBar.tween('opacity', 0);
                }
            }.bind(this)).delay(2000);
        }

        this.smallProgressBar.set('text', text);
    },

    fileUploadCalcSpeed: function(pForce) {

        if (this.fileUploadSpeedInterval && !pForce) {
            return;
        }

        var speed = ' -- KB/s, ' + _('%s minutes left').replace('%s', '--:--');
        var again = false;

        if (this.fileUploadSpeedLastCheck == 0) {
            this.fileUploadSpeedLastCheck = (new Date()).getTime() - 1000;
        }

        var timeDiff = (new Date()).getTime() - this.fileUploadSpeedLastCheck;
        var bytesDiff = this.fileUploadedLoadedBytes - this.fileUploadedSpeedLastLoadedBytes;

        var d = timeDiff / 1000;

        var byteSpeed = bytesDiff / d;

        if (byteSpeed > 0) {
            this.fileUploadSpeedLastByteSpeed = byteSpeed;
        }

        var residualBytes = this.fileUploadedTotalBytes - this.fileUploadedLoadedBytes;
        var time = '<span style="color: green;">' + _('Done') + '</span>';
        if (residualBytes > 0) {

            var timeLeftSeconds = residualBytes / byteSpeed;
            var timeLeft = (timeLeftSeconds / 60).toFixed(2);

            time = _('%s minutes left').replace('%s', timeLeft);
        } else {
            //done
            clearInterval(this.fileUploadSpeedInterval);
        }

        if (this.fileUploadSpeedLastByteSpeed == 0) {
            speed = ' -- KB/s';
        } else {
            speed = ' ' + jarves.bytesToSize(this.fileUploadSpeedLastByteSpeed) + '/s, ' + time;
        }

        this.fileUploadDialogAllSpeed.set('html', speed);

        this.fileUploadSpeedLastCheck = (new Date()).getTime();

        this.fileUploadedSpeedLastLoadedBytes = this.fileUploadedLoadedBytes;

        if (!this.fileUploadSpeedInterval) {
            this.fileUploadSpeedInterval = this.fileUploadCalcSpeed.periodical(500, this, true);
        }

        return this.fileUploadSpeedLastByteSpeed;
    },

    uploadProgress: function(pFile, pBytesCompleted, pBytesTotal) {

        var percent = Math.ceil((pBytesCompleted / pBytesTotal) * 100);
        this.uploadTrs[ pFile.id ].progress.setValue(percent);
        this.uploadTrs[ pFile.id ].loaded = pBytesCompleted;

        this.fileWatcher[pFile.id].setProgress(percent, true);

        this.uploadAllProgress();
    },

    uploadStart: function(pFile) {
        this.uploadTrs[ pFile.id ].status.set('html', t('Uploading ...'));
        this.fileWatcher[pFile.id].fireEvent('start');
    },

    uploadComplete: function(pFile) {
        if (!this.uploadTrs[ pFile.id ]) {
            return;
        }

        this.fileWatcher[pFile.id].setDone(true, true);

        this.uploadTrs[ pFile.id ].status.set('html', '<span style="color: green">' + _('Complete') + '</span>');
        this.uploadTrs[ pFile.id ].progress.setValue(100);

        this.uploadTrs[ pFile.id ].complete = true;
        this.uploadTrs[ pFile.id ].loaded = pFile.size;

        this.uploadTrs[ pFile.id ].deleteTd.destroy();

        this.uploadAllProgress();

        if (this && this.reload) {
            this.reload();
        }

        if ('function' === typeOf(this.callbacks[pFile.id])) {
            this.callbacks[pFile.id].call();
            delete this.callbacks[pFile.id];
        }

        this.uploadNext();
    },

    uploadError: function(pFile, pResponseText) {
        if (!pFile) {
            return;
        }

        if (!this.uploadTrs[ pFile.id ]) {
            return;
        }

        this.showDialog();

        var xhr = this.html5UploadXhr[ pFile.id ];

        this.uploadTrs[ pFile.id ].deleteTd.destroy();
        if (xhr) {
            xhr.abort();
        }

        var error = 'error';
        if (jarves.settings.upload_max_filesize && jarves.settings.upload_max_filesize < pFile.size) {
            error = 'fileSizeLimit';
            this.uploadTrs[ pFile.id ].status.set('html', '<span style="color: red">' + t('File size limit exceeded') + '</span>');
            new Element('img', {
                style: 'position: relative; top: 2px; left: 2px;',
                src: _path + 'bundles/jarves/admin/images/icons/error.png',
                title: t('The file size exceeds the limit allowed by upload_max_filesize or post_max_size on your server. Please contact the administrator.')
            }).inject(this.uploadTrs[ pFile.id ].status);
        } else {
            if (this.uploadTrs[ pFile.id ].canceled) {
                this.uploadTrs[ pFile.id ].status.set('html', '<span style="color: red">' + t('Canceled') + '</span>');
            } else {
                var text = t('Unknown error');
                if (xhr) {
                    try {
                        switch (xhr.status) {
                            case 413:
                                error = 'RequestEntityTooLarge';
                                text = t('413: Request Entity Too Large');
                                break;
                        }
                    } catch (e) {
                    }
                }
                this.uploadTrs[ pFile.id ].status.set('html', '<span style="color: red">' + text + '</span>');
            }
        }

        if (!this.uploadTrs[ pFile.id ].canceled) {
            this.fileWatcher[pFile.id].fireEvent('error', error);
        }
        this.uploadTrs[ pFile.id ].error = true;

        this.uploadAllProgress();
        this.uploadNext();
    },

    clear: function() {
        Object.each(this.uploadTrs, function(tr, id) {
            if (tr.complete || tr.canceled || tr.error) {
                tr.destroy()
            }
        });
        this.clearUploadVars();
        this.uploadAllProgress();
    },

    clearUploadVars: function() {
        this.uploadFilesCount = 0;
        delete this.uploadTrs;

        this.uploadTrs = {};
        this.uploadFileNames = {};

        this.fileUploadedTotalBytes = 0;
        this.fileUploadedLoadedBytes = 0;
        this.fileUploadSpeedLastCheck = 0;
        this.fileUploadedSpeedLastLoadedBytes = 0;

        this.fileUploadedLoadedBytes = 0;
        this.fileUploadSpeedLastByteSpeed = 0;

        delete this.fileUploadSpeedInterval;

        if (this.uploadOverwriteAllButton) {
            this.uploadOverwriteAllButton.destroy();
        }

        delete this.uploadOverwriteAllButton;
    },

    cancelUpload: function(fileId, internal) {
        var tr = this.uploadTrs[ fileId ];
        tr.canceled = true;
        if (this.html5UploadXhr[ fileId ]) {
            this.html5UploadXhr[ fileId ].abort();
        }
        if (internal) {
            this.fileWatcher[pFile.id].fireEvent('cancel');
        }
//        jarves.uploads[this.win.id].cancelUpload(pFile.id);
    },

    cancelUploads: function(internal) {
        try {
            //flash calls are sometimes a bit buggy.
            Object.each(this.uploadTrs, function(tr, id) {
                if (!tr.complete && tr.file) {
                    this.cancelUpload(tr.file, internal);
                }
            }.bind(this))
        } catch (e) {
            logger(e);
        }

        if (this.fileUploadSpeedInterval) {
            clearInterval(this.fileUploadSpeedInterval);
        }

        this.clearUploadVars();
    }

});