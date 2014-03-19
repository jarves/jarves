jarves.DatePicker = new Class({

    Implements: [Options, Events],

    options: {
        days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
        months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        shortDays: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        time: false
    },

    initialize: function(pInput, pOptions) {

        this.setOptions(pOptions);

        if (this.options.time == true) {
            this.options.format = '%d.%m.%Y %H:%M';
        } else {
            this.options.format = '%d.%m.%Y';
        }

        if (pInput.get('tag') != 'input') {
            this.input = new Element('input', {
                type: 'text',
                'class': 'jarves-Input-text'
            }).inject(pInput);
        } else {
            this.input = pInput;
        }

        var kwindow = this.input.getParent('.kwindow-border');
        if (kwindow) {
            kwindow.windowInstance.addEvent('close', function() {
                if (this.chooser) {
                    this.chooser.destroy();
                }
            }.bind(this));
        }

        this.attach();
    },

    attach: function() {
        this._renderChooser();
        var blacklist = ['tab', 'esc'];
        this.input.addEvent('keydown', function(e) {
            if (false === blacklist.indexOf(e.key)) {
                e.stop();
            } else {
                this.close();
            }
        }.bind(this));

        this.input.addEvent('click', this.show.bind(this));

        this.choose(this.choosenDate);
    },

    renderMonth: function(pRenderInput) {
        if (this.choosenDate == null) {
            return;
        }
        this.tableBody.empty();

        this.monthSelect.set('text', this.options.months[this.choosenDate.format('%m').toInt() - 1]);
        this.yearSelect.set('text', this.choosenDate.format('%Y').toInt());

        var firstDay = this.choosenDate.clone().set('date', 1);
        var lastDay = this.choosenDate.get('lastdayofmonth');
        this.currentBodyTr = new Element('tr').inject(this.tableBody);

        var t = firstDay.format('%w');
        if (t == 0) {
            t = 7;
        }
        for (var i = 1; i < t; i++) {
            this._renderItem(firstDay.clone().decrement('day', t - i), true);
        }

        var tempDate = this.choosenDate.clone();
        for (var i = 1; i <= this.choosenDate.get('lastdayofmonth'); i++) {
            tempDate.set('date', i);
            var day = tempDate.format('%w');
            if (day == 0) {
                day = 7;
            }

            this._renderItem(tempDate.clone());

            if (day == 7) { //last day in this week
                this.currentBodyTr = new Element('tr').inject(this.tableBody);
            }
        }

        var currentDayInWeek = tempDate.set('date', lastDay).format('%w');
        for (var i = 1; i <= (7 - currentDayInWeek); i++) {
            this._renderItem(tempDate.clone().increment('day', i), true);
        }

        if (pRenderInput) {
            this.renderInput();
        }

    },

    _renderItem: function(pDate, pGray) {
        var myclass = 'jarves-datePicker-item';

        if (pDate.format('db') == this.choosenDate.format('db')) {
            myclass = ' jarves-datePicker-item-selected';
        }

        if (pGray) {
            myclass += ' jarves-datePicker-item-gray';
        }

        var td = new Element('td', {
            'class': myclass
        }).inject(this.currentBodyTr);

        new Element('a', {
            text: pDate.get('date'),
            'class': myclass
        }).addEvent('click', function() {
                this.choose(pDate, true);
            }.bind(this)).inject(td);
    },

    choose: function(pDate, pInternal) {
        this.noDate = (pDate == null) ? true : false;
        this.choosenDate = pDate;
        this.renderInput();
        if (pInternal) {
            this.fireEvent('change', this.getTime());
        }
        this.close();
    },

    renderInput: function() {
        if (this.noDate) {
            this.input.value = '';
        } else {
            this.input.set('value', this.choosenDate.format(this.options.format));
        }
    },

    setDate: function(pDate) {
        this.choose(pDate);
    },

    getDate: function() {
        return ( this.noDate == false ) ? this.choosenDate : null;
    },

    getTime: function() {
        return ( this.noDate == false ) ? (this.choosenDate.getTime() / 1000).toFixed(0) : 0;
    },

    getValue: function() {
        return this.choosenDate ? this.choosenDate.format(this.options.format) : null;
    },

    setTime: function(pTime) {
        if (pTime != false && pTime) {
            this.choosenDate = new Date();
            this.choosenDate.setTime(pTime * 1000);
        } else {
            this.choosenDate = null;
        }
        this.choose(this.choosenDate);
    },

    setTimes: function(e) {
        if (this.timeHours.value > 24) {
            this.timeHours.value = 24;
        }
        if (this.timeHours.value < 0) {
            this.timeHours.value = 0;
        }

        if (this.timeMinutes.value > 59) {
            this.timeMinutes.value = 59;
        }
        if (this.timeMinutes.value < 0) {
            this.timeMinutes.value = 0;
        }

        if (e.key.toInt() == 'NaN') {
            e.stop();
        } //TODO

        if (this.choosenDate != null) {
            this.choosenDate.set('hours', this.timeHours.value);
            this.choosenDate.set('minutes', this.timeMinutes.value);
            this.renderInput();
        }
    },

    renderTime: function() {
        if (this.time && this.choosenDate) {
            this.timeHours.value = this.choosenDate.get('hours');
            this.timeMinutes.value = this.choosenDate.get('minutes');
        }
    },

    updatePos: function() {

        if (this.chooser && this.chooser.getParent()) {

            this.chooser.position({
                relativeTo: this.input,
                position: 'bottomRight',
                edge: 'upperRight'
            });

            return;

            var cor = this.input.getCoordinates(document.body);

            this.chooser.setStyles({
                left: cor.left,
                'top': cor['top'] + cor.height
            });

            var chooserSize = this.chooser.getSize();

            var bodySize = document.body.getSize();
            if (cor['top'] + cor.height + chooserSize.y > bodySize.y) {
                this.chooser.setStyle('top', cor['top'] - chooserSize.y);
            }
        }

    },

    show: function(e) {

        if (this.noDate) {
            this.choosenDate = new Date();
        }

        this.renderMonth();

        this.lastAutoPositionLastOverlay = jarves.openDialog({
            element: this.chooser,
            target: this.input
        });
    },

    close: function() {

        if (this.chooser) {
            this.chooser.dispose();
        }
        if (this.lastAutoPositionLastOverlay) {
            this.lastAutoPositionLastOverlay.destroy();
        }

    },

    _renderChooser: function() {
        this.mouseover = false;

        this.chooser = new Element('div', {
            'class': 'jarves-datePicker-chooser',
            styles: {
                'z-index': 80000000
            }
        }).addEvent('mouseover', function() {
                this.mouseover = true;
            }.bind(this)).addEvent('mouseout', function() {
                this.mouseover = false;
            }.bind(this));

        this.body = new Element('div', {
            'class': 'jarves-datePicker-body'
        }).inject(this.chooser);

        /*******
         month Selection
         ********/
        this.month = new Element('div', {
            'class': 'jarves-datePicker-month'
        }).inject(this.body);

        this.monthSelect = new Element('span').inject(this.month);

        var a = new Element('a', {
            text: '«',
            'class': 'jarves-Button jarves-button'
        }).addEvent('click', function() {
                this.choosenDate.decrement('month');
                this.renderMonth(true);
            }.bind(this)).inject(this.monthSelect, 'before');

        new Element('span').inject(a);

        var a = new Element('a', {
            text: '»',
            'class': 'jarves-Button jarves-button'
        }).addEvent('click', function() {
                this.choosenDate.increment('month');
                this.renderMonth(true);
            }.bind(this)).inject(this.monthSelect, 'before');
        new Element('span').inject(a);

        /*******
         year selection
         ********/
        this.year = new Element('div', {
            'class': 'jarves-datePicker-year'
        }).inject(this.body);

        this.yearSelect = new Element('span').inject(this.year);

        var a = new Element('a', {
            text: '»',
            'class': 'jarves-Button jarves-button'
        }).addEvent('click', function() {
                this.choosenDate.increment('year');
                this.renderMonth(true);
            }.bind(this)).inject(this.yearSelect, 'after');
        new Element('span').inject(a);

        var a = new Element('a', {
            text: '«',
            'class': 'jarves-Button jarves-button'
        }).addEvent('click', function() {
                this.choosenDate.decrement('year');
                this.renderMonth(true);
            }.bind(this)).inject(this.yearSelect, 'after');
        new Element('span').inject(a);

        new Element('div', {
            style: 'clear: both'
        }).inject(this.body);

        /*******
         time picker
         *******/
        if (this.options.time == true) {
            this.time = new Element('div', {'class': 'jarves-datePicker-time'}).inject(this.body);

            this.timeHours = new Element('input', {'class': 'jarves-datePicker-timeHours'}).addEvent('keydown', function(e) {
                    this.setTimes.call(this, e)
                }.bind(this)).addEvent('keyup', function(e) {
                    this.setTimes.call(this)
                }.bind(this)).inject(this.time);

            new Element('span', {text: ':'}).inject(this.time);

            this.timeMinutes = new Element('input', {'class': 'jarves-datePicker-timeMinutes'}).addEvent('keydown', function(e) {
                    this.setTimes.call(this, e)
                }.bind(this)).addEvent('keyup', function(e) {
                    this.setTimes.call(this, e)
                }.bind(this)).inject(this.time);
        }

        /*******
         Day Table
         ********/
        this.table = new Element('table', {
            cellpadding: 0, cellspacing: 0
        }).inject(this.body);
        this.tableHead = new Element('thead').inject(this.table);
        this.tableBody = new Element('tbody').inject(this.table);

        var tr = new Element('tr').inject(this.tableHead);
        this.options.shortDays.each(function(day, index) {
            new Element('th', {
                text: day
            }).inject(tr);
        });

        if (this.options.empty) {
            var a = new Element('a', {
                href: 'javascript: ;',
                html: _('Empty'),
                'class': 'jarves-Button jarves-button'
            }).addEvent('click', function() {
                    this.choose(null, true);
                }.bind(this)).inject(this.body);
            new Element('span').inject(a);
        }

        var a = new Element('a', {
            href: 'javascript: ;',
            html: _('Now'),
            'class': 'jarves-Button jarves-button'
        }).addEvent('click', function() {
                this.choose(new Date(), true);
            }.bind(this)).inject(this.body);
        new Element('span').inject(a);

    }
});
