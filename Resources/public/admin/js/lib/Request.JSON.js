/**
 * Request.JSON - extended to get some informations about calls and creates info for user if a call fails.
 */
Request.JSON = new Class({
    Extends: Request.JSON,

    saveButton: null,

    initialize: function (options) {
        options = options || {};

        options.urlEncoded = false;
        options.emulation = false;

        if (!'secure' in options) {
            options.secure = true;
        }
        this.addEvent('complete', this.checkError.bind(this));
        this.addEvent('error', this.invalidJson.bind(this));

        this.addEvent('complete', function (pData) {
            window.fireEvent('restCall', [pData, this]);
        }.bind(this));

        if (options.progressButton) {
            this.addEvent('progress', function(event) {
                options.progressButton.setProgress(parseInt(event.loaded / event.total * 100));
            });
        }

        if (options.saveStatusButton) {
            this.saveButton = options.saveStatusButton;
            this.addEvent('failure', function() {
                this.saveButton.failedLoading(this.options.saveStatusButtonFailureText);
            }.bind(this));
            this.addEvent('success', function() {
                this.saveButton.doneLoading(this.options.saveStatusButtonSuccessText);
            }.bind(this));
        }

        this.parent(options);
        Object.append(this.headers, {
            'Content-Type': 'application/json'
        });

        if (options.noErrorReporting === true) {
            return;
        }
    },

    send: function(options) {
        if (this.saveButton) {
            this.saveButton.startLoading(this.options.saveStatusButtonStartText || t('Saving ...'));
        }

        if (!options.method || options.method.toLowerCase() !== 'get') {
            options.data = JSON.encode(options.data);
        }

        return this.parent(options);
    },

    requestOptions: function(data) {
        var object = {
            method: 'OPTIONS'
        };
        if (data != null) {
            object.data = data;
        }
        return this.send(object);
    },

    requestDelete: function(data) {
        var object = {
            method: 'DELETE'
        };
        if (data != null) {
            object.data = data;
        }
        return this.send(object);
    },

    patch: function(data) {
        var object = {
            method: 'PATCH'
        };
        if (data != null) {
            object.data = data;
        }
        return this.send(object);
    },

    onFailure: function () {
        var text = this.response.text;
        var json;

        try {
            json = this.response.json = JSON.decode(text, this.options.secure);
        } catch (error) {
            this.fireEvent('error', [text, error]);
            return;
        }

        var args = [json, this.response.xml];
        this.fireEvent('complete', args).fireEvent('failure', [this.xhr, args[0], args[1]]);
    },

    invalidJson: function () {
        if (jarves.lastRequestBubble) {
            jarves.lastRequestBubble.die();
            delete jarves.lastRequestBubble;
        }

        this.fireEvent('failure');

        if (!jarves.adminInterface || !jarves.adminInterface.getHelpSystem()) {
            return false;
        }

        jarves.lastRequestBubble = jarves.adminInterface.getHelpSystem().newBubble(
            t('Response error'),
            t('Server\'s response is not valid JSON. Looks like the server has serious troubles. :-(') +
                "<br/>" + 'URI: %s'.replace('%s', this.options.url) +
                '<br/><a class="jarves-Button" href="javascript:;">Details</a>',
            15000);
        throw 'Response Error %s'.replace('%s', this.options.url);
    },

    checkError: function (response) {
        if (response && response.error) {

            if (typeOf(this.options.noErrorReporting) == 'array' &&
                this.options.noErrorReporting.contains(response.error)) {
                this.fireEvent('exception', response);
                return false;
            }

            if (true === this.options.noErrorReporting) {
                this.fireEvent('exception', response);
                return false;
            }

            if (jarves.lastRequestBubble) {
                jarves.lastRequestBubble.die();
                delete jarves.lastRequestBubble;
            }

            if (!jarves.adminInterface || !jarves.adminInterface.getHelpSystem()) {
                return false;
            }

            if ('AccessDeniedException' === response.error) {
                jarves.lastRequestBubble = jarves.adminInterface.getHelpSystem().newBubble(
                    t('Access denied'),
                    t('You started a secured action or requested a secured information.') +
                        "<br/>" + 'URI: %s'.replace('%s', this.options.url) +
                        '<br/><a class="jarves-Button" onclick="jarves.open(\'admin/system/rest-logger\')">Details</a>',
                    15000
                );
                throw 'Access Denied %s'.replace('%s', this.options.url);
            } else {
                jarves.lastRequestBubble = jarves.adminInterface.getHelpSystem().newBubble(
                    t('Request error'),
                    t('There has been a error occured during the last request. It looks like the server has currently some troubles. Please try it again.') +
                        "<br/><br/>" + t('Error code: %s').replace('%s', response.error) +
                        "<br/>" + t('Error message: %s').replace('%s', response.message) +
                        "<br/>" + 'URI: %s'.replace('%s', this.options.url) +
                        '<br/><a class="jarves-Button" onclick="jarves.wm.open(\'admin/system/rest-logger\')">Details</a>',
                    15000
                );
            }
        }
    }
});