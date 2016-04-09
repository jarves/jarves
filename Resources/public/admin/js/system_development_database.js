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

var jarves_system_development_database = new Class({

    initialize: function (pWin) {

        this.win = pWin;

        this._createLayout();

    },

    _createLayout: function () {
        this.sqlEntry = new Element('div', {
            style: 'position: absolute; left: 5px; right: 14px; top: 5px; height: 170px;'
        }).inject(this.win.content);

        new Element('div', {
            style: 'padding: 2px; 0px;',
            html: _('Current database is:') + ' <b>' + jarves.settings.system.db_type + '</b> @ ' +
                jarves.settings.system.db_server
        }).inject(this.sqlEntry);

        this.sqlArea = new Element('textarea', {
            style: 'width: 100%; height: 110px; color: gray;',
            'class': 'html',
            value: _('Type here your SQL ..')
        }).addEvent('focus',
            function () {
                if (this.value == _('Type here your SQL ..')) {
                    this.setStyle('color', '#444444');
                    this.value = '';
                }
            }).addEvent('blur',
            function () {
                if (this.value == '') {
                    this.setStyle('color', 'gray');
                    this.value = _('Type here your SQL ..');
                }
            }).inject(this.sqlEntry);

        this.sqlEntryActions =
            new Element('div', {style: 'text-align: right; position: relative;'}).inject(this.sqlEntry);

        this.sqlStatus = new Element('div',
            {style: 'position: absolute; left: 5px; top: 2px; color: gray;'}).inject(this.sqlEntryActions);

        this.goSql = new jarves.Button(_('Execute')).addEvent('click', this.goSql.bind(this)).inject(this.sqlEntryActions);

        new Element('div', {style: 'padding: 2px; 0px;', html: _('Result:')}).inject(this.sqlEntry);

        this.sqlResult = new Element('div', {
            style: 'position: absolute; left: 5px; right: 10px; top: 185px; bottom: 5px; border: 1px solid #ddd;'
        }).inject(this.win.content);

    },

    goSql: function () {
        if (this.sqlArea.value == _('Type here your SQL ..')) {
            this.sqlArea.highlight();
            return;
        }

        this.sqlStatus.set('html', _('Loading ...'));
        var start = new Date().get('time');
        new Request.JSON({url: _pathAdmin +
            'admin/system/tools/database/execute', noCache: 1, onComplete: function (res) {
            var end = new Date().get('time');

            var difftime = (end - start).toFixed(2);

            this.sqlStatus.set('html', _('%sms execution time').replace('%s', res.exectime.toFixed(2)) + ', ' +
                _('%sms fetching time').replace('%s', res.fetchtime.toFixed(2)) + ', ' +
                _('%sms request time').replace('%s', difftime));

            this.renderResult(res);

        }.bind(this)}).post({sql: this.sqlArea.value});
    },

    renderResult: function (pRes) {

        if (pRes.error) {

            this.sqlResult.empty();
            var t = new Element('div',
                {text: _('An error has occurred') + ': ', style: 'padding: 15px;'}).inject(this.sqlResult);
            new Element('div', {html: '<span style="color: gray;">' + pRes.error +
                "</span>", style: 'padding: 15px;'}).inject(this.sqlResult);

        } else {
            if (pRes.items && pRes.items.length == 0) {

                this.sqlResult.set('text', _('Successfull executed. 0 items returned.'));

            } else {
                var columns = [];
                this.sqlResult.empty();

                var table = new Element('table',
                    {'class': 'jarves-Table-head jarves-Table-body', cellspacing: 0, cellpadding: 2}).inject(this.sqlResult);
                var thead = new Element('thead').inject(table);
                var tr = new Element('tr').inject(thead);

                $H(pRes.items[0]).each(function (entry, column) {
                    new Element('th', {text: column}).inject(tr);
                });

                var tbody = new Element('tbody').inject(table);

                pRes.items.each(function (row) {

                    var tr = new Element('tr').inject(tbody);
                    $H(row).each(function (value, key) {
                        new Element('td', {text: value}).inject(tr);
                    });
                }.bind(this));
            }

        }

    }

})