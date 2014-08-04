jarves.Select = new Class({
    Implements: [Options, Events],

    Binds: ['addItemToChooser', 'checkScroll', 'search', 'actions', 'focus', 'blur', 'fireChange'],

    opened: false,
    value: null,

    /**
     * Items if we have fixed items.
     * @type {Object}
     */
    items: [],

    /**
     * Items which should not be visible.
     * @type {Object}
     */
    hideItems: {},

    cache: {},

    /**
     * Items that are currently visible in the chooser.
     * @type {Object}
     */
    currentItems: [],
    duringFirstSelectLoading: false,

    a: {},
    enabled: true,

    searchValue: '',

    cachedObjectItems: {},

    objectFields: [],
    loaded: 0,
    maximumItemsReached: false,
    whileFetching: false,
    loaderId: 0,
    backupedTitle: false,

    labelTemplate: ''
    + '{% if jarvesSelectImage %}'
        + '{% if jarvesSelectImage[0] == "#" %}<span class="{{ jarvesSelectImage|substr(1) }}">{% endif %}'
        + '{% if jarvesSelectImage[0] != "#" %}<img src="{{ jarvesSelectImage }}" />{% endif %}'
    + '{% endif %}' + '{{ label }}'
    + '{% if jarvesSelectImage and jarvesSelectImage[0] == "#" %}</span>{% endif %}',

    options: {

        /**
         * Static items. You can pass a array of items or a object. In case of the object, the value-key is returned
         * as value. In case of the array, the actual label value is returned as value;
         *
         * Examples:
         *
         *  //take care with this one: JavaScript does not have a guarantee for the order. Use `objectItems` instead.
         *  items: {
         *    value: 'Label',
         *    value2: 'Label 2',
         *  }
         *
         *  items: [
         *     'Label', //will have value=0
         *     'Label 2' //will have value=1
         *  ]
         *
         * @var {Array|Object}
         */
        items: null, //array or object

        /**
         * When options.items is a array and this is false the value is the index, otherwise index=label.
         *
         * true:
         *     ['a', 'b', 'c'] => 'c' returns 'c' as value
         * false:
         *     ['a', 'b', 'c'] => 'c' returns 2 as value
         *
         * @var {Boolean}
         */
        itemsLabelAsValue: true,

        /**
         * Same as `items` but since object entries have in JavaScript no fixed order,
         * we can pass here a list of entries with a fixed order.
         *
         * Example:
         *
         *  objectItems: [
         *     {value: 'Label'},
         *     {value2: 'Label 2'},
         *  ]
         *
         * @var {Array}
         */
        objectItems: null,

        /**
         * Pass here the entry point path to your store.
         * You'll get as value always the raw id of your store. Not urlencoded as it is if you pass an object key.
         *
         * @var {String}
         */
        store: null, //string

        /**
         * If you pass an object, the REST entry point jarves/admin/object/<object>/ is called and you'll
         * get as value always an array containing the primary keys.
         *
         * @var {String}
         */
        object: false,

        /**
         * Use a other field as label as the default.
         *
         * @var {String}
         */
        objectLabel: null,

        /**
         * Requests more fields at the REST backend, so
         * you have more information iny our template/
         */
        objectFields: null,

        /**
         * The language. If the `object` is multi-language based, we filter
         * it by `objectLanguage` per default at the REST backend.
         *
         * @var {String}
         */
        objectLanguage: null,

        /**
         * More filter.
         *
         * {
         *    field1: 'filterByThis'
         * }
         *
         * @todo implement it
         *
         * @var {Object}
         */
        filter: {},

        /**
         * Whether to use a branch or not
         * jarves/admin/object/<object>/<objectBranch>:branch
         *
         * Contains the pk of the branch entry.
         *
         * Use true for the root.
         * Define `objectScope`, if the target object has multiple roots.
         *
         * @var {Boolean|String|Integer}
         */
        objectBranch: null,

        /**
         * The scope value, if you have objectBranch defined.
         *
         * @var {String|Integer}
         */
        objectScope: null,

        /**
         * Custom label template. Use `objectFields` if you use here more fields than
         * the default REST backend returns.
         *
         * @var {String}
         */
        labelTemplate: null,

        /**
         * Default items per load.
         *
         * @var {Number}
         */
        maxItemsPerLoad: 40, //number

        /**
         * Shows now border, background etc.
         *
         * @var {Boolean}
         */
        transparent: false,

        /**
         * @TODO
         *
         * @var {Boolean}
         */
        combobox: false,

        /**
         * @var {Boolean}
         */
        disabled: false,

        /**
         * Tries to select the first entry.
         *
         * @var {Boolean}
         */
        selectFirst: true,

        /**
         * Selects the first entry if the value is null.
         *
         * @var {Boolean}
         */
        selectFirstOnNull: true
    },

    initialize: function(pContainer, pOptions) {
        this.setOptions(pOptions);
        this.container = pContainer;

        this.createLayout();
        this.mapEvents();

        if (this.options.disabled)
            this.setEnabled(false);

        if (this.options.transparent) {
            this.box.addClass('jarves-Select-transparent');
        }

        this.prepareOptions();

        if (this.options.selectFirst) {
            this.selectFirst(null, true);
        } else {
            this.fireEvent('ready');
        }
    },

    createLayout: function() {
        this.box = new Element('a', {
            href: 'javascript: ;',
            'class': 'jarves-normalize jarves-Select-box jarves-Select-box-active'
        }).addEvent('click', this.toggle.bind(this));

        this.box.instance = this;

        this.title = new Element('div', {
            'class': 'jarves-Select-box-title'
        }).addEvent('mousedown', function(e) {
                e.preventDefault();
            }).inject(this.box);

        this.arrowBox = new Element('div', {
            'class': 'jarves-Select-arrow icon-arrow-17'
        }).inject(this.box);

        this.chooser = new Element('div', {
            'class': 'jarves-Select-chooser jarves-normalize'
        });

        if (this.container) {
            this.box.inject(this.container);
        }
    },

    mapEvents: function() {
        this.box.addEvent('keydown', this.actions);
        this.box.addEvent('keyup', this.search);
        this.box.addEvent('focus', this.focus);
        this.box.addEvent('blur', function() {
            this.blur.delay(50, this);
        }.bind(this));

        this.chooser.addEvent('mousedown', function() {
            this.blockNextBlur = true;
        }.bind(this));

        this.chooser.addEvent('click', function(e) {
            if (!e || !(item = e.target)) {
                return;
            }
            if (!item.hasClass('jarves-select-chooser-item') && !(item = item.getParent('.jarves-select-chooser-item'))) {
                return;
            }

            this.chooseItem(item.kaSelectId, true);
            this.close(true);
        }.bind(this));

        this.chooser.addEvent('scroll', this.checkScroll);
    },

    prepareOptions: function() {
        if (this.options.items) {
            if (typeOf(this.options.items) == 'object') {
                Object.each(this.options.items, function(label, id) {
                    this.items.push({id: id, label: label});
                }.bind(this));
            }

            if (typeOf(this.options.items) == 'array') {
                if (this.options.itemsKey) {
                    if (this.options.itemsLabel) {
                        Array.each(this.options.items, function(item) {
                            this.items.push({id: item[this.options.itemsKey], label: item[this.options.itemsLabel]});
                        }.bind(this));
                    } else {
                        Array.each(this.options.items, function(item) {
                            this.items.push({id: item[this.options.itemsKey], label: item});
                        }.bind(this));
                    }
                } else {
                    Array.each(this.options.items, function(label, idx) {
                        this.items.push({id: this.options.itemsLabelAsValue ? label : idx, label: label});
                    }.bind(this));
                }
            }
        } else if (this.options.objectItems) {
            Array.each(this.options.objectItems, function(obj) {
                Object.each(obj, function(label, idx) {
                    this.items.push({id: idx, label: label});
                }.bind(this));
            }.bind(this));
        } else if (this.options.object) {
            this.options.object = jarves.normalizeObjectKey(this.options.object);
            this.objectDefinition = jarves.getObjectDefinition(this.options.object);

            var fields = [];
            if (this.options.objectFields) {
                fields = this.options.objectFields;
            } else if (this.options.objectLabel) {
                fields.push(this.options.objectLabel);
            }

            if (typeOf(fields) == 'string') {
                fields = fields.replace(/[^a-zA-Z0-9_]/g, '').split(',');
            }
            this.objectFields = fields;

        }
    },

    focus: function() {
    },

    blur: function() {
        if (this.blockNextBlur) {
            return this.blockNextBlur = false;
        }
        this.close();
    },

    /**
     *
     * @param {Number} offset
     * @param {Function} callback
     * @param {Number} count
     */
    loadObjectItems: function(offset, callback, count) {
        if (!count) {
            count = this.options.maxItemsPerLoad;
        }

        if (this.lastRq) {
            this.lastRq.cancel();
        }

        var cacheKey = offset + '.'+count;
        if (this.cache[cacheKey]) {
            callback(this.cache[cacheKey]);
            return;
        }

        if (this.options.object) {
            this.lastRq = new Request.JSON({url: this.getObjectUrl(),
                noErrorReporting: ['NoAccessException'],
                onCancel: function() {
                    callback(false);
                },
                onComplete: function(response) {

                    if (response.error) {
                        //todo, handle NoAccessException error
                        return false;
                    } else {

                        var items = [];

                        if (null !== response.data) {
                            Array.each(response.data, function(item) {

                                var id = jarves.getObjectUrlId(this.options.object, item);

                                if (this.hideOptions && this.hideOptions.contains(id)) {
                                    return;
                                }

                                items.push({
                                    id: id,
                                    label: item
                                });

                                this.cachedObjectItems[id] = item;

                            }.bind(this));
                        }

                        this.cache[cacheKey] = items;
                        callback(items);
                    }
                }.bind(this)
            }).get({
                    //object: this.options.object,
                    offset: offset,
                    limit: count,
                    _lang: this.options.objectLanguage,
                    scope: this.options.objectScope,
                    fields: this.objectFields ? this.objectFields.join(',') : null
                });
        }
    },

    reload: function() {
        this.cachedObjectItems = {};
        this.cache = {};
        this.setValue(this.getValue());
    },

    getObjectUrl: function() {
        var uri = _pathAdmin + 'object/' + jarves.normalizeObjectKey(this.options.object) +'/';

        if (this.options.objectBranch) {
            if (this.options.objectBranch === true) {
                uri += ':branch';
            } else {
                uri += jarves.urlEncode(this.options.objectBranch) + '/:branch';
            }
        }

        return uri;
    },

    reset: function() {
        this.chooser.empty();
        this.maximumItemsReached = false;

        this.loaded = 0;
        this.currentItems = {};

        if (this.lastRq) {
            this.lastRq.cancel();
        }
    },

    checkScroll: function() {
        if (this.maximumItemsReached) {
            return;
        }
        if (this.whileFetching) {
            return;
        }

        var scrollPos = this.chooser.getScroll();
        var scrollMax = this.chooser.getScrollSize();
        var maxY = scrollMax.y - this.chooser.getSize().y;

        if (scrollPos.y + 10 < maxY) {
            return;
        }

        this.loadItems();
    },

    actions: function(pEvent) {
        if (pEvent.key == 'esc') {
            this.searchValue = '';
            this.close(true);
            pEvent.stopPropagation();
            return;
        }

        if (pEvent.key == 'enter' || pEvent.key == 'space' || pEvent.key == 'down' || pEvent.key == 'up') {
            var current = this.chooser.getElement('.jarves-select-chooser-item-active');

            if (['down', 'up'].contains(pEvent.key)) {
                pEvent.stop();
            }

            if (pEvent.key == 'enter' || (this.searchValue.trim() == '' && pEvent.key == 'space')) {

                if (this.isOpen()) {
                    this.close(true);
                    if (current) {
                        this.chooseItem(current.kaSelectId, true);
                    }
                } else {
                    this.blockNextSearch = true;
                    this.open();
                }
                return;
            }

            if (pEvent.key == 'down') {
                if (!current) {
                    var first = this.chooser.getElement('.jarves-select-chooser-item');
                    if (first) {
                        first.addClass('jarves-select-chooser-item-active');
                    }
                } else {
                    current.removeClass('jarves-select-chooser-item-active');
                    var next = current.getNext();
                    if (next) {
                        next.addClass('jarves-select-chooser-item-active');
                    } else {
                        var first = this.chooser.getElement('.jarves-select-chooser-item');
                        if (first) {
                            first.addClass('jarves-select-chooser-item-active');
                        }
                    }
                }
            }

            if (pEvent.key == 'up') {
                if (!current) {
                    var last = this.chooser.getLast('.jarves-select-chooser-item');
                    if (last) {
                        last.addClass('jarves-select-chooser-item-active');
                    }
                } else {
                    current.removeClass('jarves-select-chooser-item-active');
                    var previous = current.getPrevious();
                    if (previous) {
                        previous.addClass('jarves-select-chooser-item-active');
                    } else {
                        var last = this.chooser.getLast('.jarves-select-chooser-item');
                        if (last) {
                            last.addClass('jarves-select-chooser-item-active');
                        }
                    }
                }
            }

            current = this.chooser.getElement('.jarves-select-chooser-item-active');

            if (current) {
                var position = current.getPosition(this.chooser);
                var height = +current.getSize().y;

                if (position.y + height > this.chooser.getSize().y) {
                    this.chooser.scrollTo(this.chooser.getScroll().x, this.chooser.getScroll().y + (position.y - this.chooser.getSize().y) + height);
                }

                if (position.y < 0) {
                    this.chooser.scrollTo(this.chooser.getScroll().x, this.chooser.getScroll().y + (position.y));
                }
            }

            return;
        }
    },

    search: function(pEvent) {
        if (this.blockNextSearch) {
            return this.blockNextSearch = false;
        }

        if (['down', 'up', 'enter', 'tab'].contains(pEvent.key)) {
            return;
        }

        if ('backspace' === pEvent.key) {
            if ('' !== this.searchValue) {
                this.searchValue = this.searchValue.substr(0, this.searchValue.length - 1);
            }
        } else if (1 === pEvent.key.length) {
            this.searchValue += pEvent.key;
        }

        if (this.searchValue.trim() && !this.isOpen()) {
            this.open(true);
        }

        this.reset();
        this.loadItems();
    },

    loadItems: function() {
        if (this.lrct) {
            clearTimeout(this.lrct);
        }

        this.lrct = this._loadItems.delay(1, this);
    },

    _loadItems: function() {
        if (!this.box.hasClass('jarves-Select-box-open')) {
            return false;
        }

        //this.chooser.empty();
        if (this.maximumItemsReached) {
            return this.displayChooser();
        }

        if (this.whileFetching) {
            return false;
        }

        this.whileFetching = true;

        //show small loader
        if (this.searchValue.trim()) {
            if (!this.title.inSearchMode) {
                this.backupedTitle = this.title.get('html');
            }

            this.title.set('text', this.searchValue);
            this.title.setStyle('color', 'gray');
            this.title.inSearchMode = true;

        } else if (this.backupedTitle !== false) {
            this.title.set('html', this.backupedTitle);
            this.title.setStyle('color');
            this.backupedTitle = false;
            this.title.inSearchMode = false;
        }

        this.lastLoader = new Element('a', {
            'text': t('Still loading ...'),
            style: 'display: none;'
        }).inject(this.chooser);

        this.lastLoaderGif = new Element('img');

        this.lastLoader.loaderId = this.loaderId++;

        var loaderId = this.lastLoader.loaderId;

        (function() {
            if (this.lastLoader && this.lastLoader.loaderId == loaderId) {
                this.lastLoader.setStyle('display', 'block');
                this.displayChooser();
            }
        }).delay(1000, this);

        this.dataProxy(this.loaded, function(pItems) {

            if (typeOf(pItems) == 'array') {

                Array.each(pItems, this.addItemToChooser);

                this.loaded += pItems.length;

                if (!pItems.length || pItems.length < this.options.maxItemsPerLoad)//no items left
                {
                    this.maximumItemsReached = true;
                }
            }

            this.displayChooser();

            this.lastLoader.destroy();
            delete this.lastLoader;

            this.whileFetching = false;
            this.checkScroll();

        }.bind(this), this.options.maxItemsPerLoad);

    },

    /**
     * @param {Object} item
     * @returns {boolean}
     */
    addItemToChooser: function(item) {
        var a;

        if (item.isSplit) {
            a = new Element('div', {
                html: item.label,
                'class': 'group'
            }).inject(this.chooser);

        } else {
            a = new Element('a', {
                'class': 'jarves-select-chooser-item',
                html: this.renderLabel(item.label)
            });

            if (this.searchValue.trim()) {

                var regex = new RegExp('(' + jarves.pregQuote(this.searchValue.trim()) + ')', 'gi');
                var match = a.get('text').match(regex);
                if (match) {
                    a.set('html', a.get('html').replace(regex, '<b>$1</b>'));
                } else {
                    a.destroy();
                    return false;
                }
            }

            a.inject(this.chooser);

            this.checkIfCurrentValue(item, a);

            a.kaSelectId = item.id;
            a.kaSelectItem = item;
            this.currentItems[item.id] = a;
        }

    },

    /**
     * @param {Object} item
     * @param {Element} a
     */
    checkIfCurrentValue: function(item, a) {
        if (item.id == this.value) {
            a.addClass('icon-checkmark-6');
            a.addClass('jarves-select-chooser-item-selected');
        }
    },

    renderLabel: function(data) {
        if (typeOf(data) == 'null') {
            return '';
        }

        var oriData = data;

        if (this.options.object && !this.options.labelTemplate) {
            //just return jarves.getObjectLabel
            return jarves.getObjectLabelByItem(this.options.object, oriData);
        }

        if (typeOf(oriData) == 'string') {
            oriData = {label: oriData};
        } else if (typeOf(oriData) == 'array') {
            //image
            oriData = {label: oriData[0], jarvesSelectImage: oriData[1]};
        }

        var template = this.labelTemplate;

        if (this.options.object && this.objectDefinition.labelTemplate) {
            template = this.objectDefinition.labelTemplate;
        }

        if (this.options.labelTemplate) {
            template = this.options.labelTemplate;
        }

        if (template == this.labelTemplate && this.options.object && this.objectFields.length > 0) {
            //we have no custom layout, but objectFields
            var label = [];
            Array.each(this.objectFields, function(field) {
                label.push(data[field]);
            });
            oriData.label = label.join(', ');
        }

        if (!oriData.jarvesSelectImage) {
            oriData.jarvesSelectImage = '';
        }

        if (typeOf(oriData.label) == 'null') {
            oriData.label = '';
        }

        if (!this.compiledTemplate) {
            this.compiledTemplate = jarves.getCompiledTemplate(template);
        }
        return this.compiledTemplate.render(oriData);
    },

    selectFirst: function(offset, internal) {
        this.duringFirstSelectLoading = true;

        if (!offset) {
            offset = 0;
        }

        this.dataProxy(offset, function(items) {
            this.duringFirstSelectLoading = false;

            if (items && items.length > 0) {
                var i = 0;
                for (i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item && !item.isSplit) {
                        if ('null' === typeOf(this.value) && 'null' !== typeOf(item.id)) {
                            this.chooseItem(item.id, internal);
                        }
                        this.fireEvent('firstItemLoaded', item.id);
                        this.fireEvent('selectFirst', item.id);
                        this.fireEvent('ready');
                        return;
                    }
                }
            }
        }.bind(this), offset + 5);
    },

    /**
     * Returns always max this.options.maxItemsPerLoad (20 default) items.
     *
     * @param {Integer}  offset
     * @param {Function} callback
     * @param {Number}   count
     */
    dataProxy: function(offset, callback, count) {
        if (!count) {
            count = this.options.maxItemsPerLoad;
        }

        if (this.items.length > 0) {
            //we have static items
            var items = [];
            var i = offset - 1;

            while (++i >= 0) {

                if (i >= this.items.length) {
                    break;
                }
                if (items.length == count) {
                    break;
                }
                if (this.options.objectLanguage && this.items[i].lang != this.options.objectLanguage) {
                    continue;
                }

                if (this.hideOptions && this.hideOptions.contains(this.items[i].id)) {
                    continue;
                }

                items.push(this.items[i]);
            }

            callback(items);
        } else if (this.options.object || this.options.store) {
            //we have object items
            this.loadObjectItems(offset, callback, count);
        } else {
            callback(false);
        }

    },

    setEnabled: function(enabled) {
        if (this.enabled === enabled) {
            return;
        }

        this.enabled = enabled;

        if (this.enabled) {
            //add back all events
            if (this.$eventsBackuper) {
                this.box.cloneEvents(this.$eventsBackuper);
            }

            this.box.removeClass('jarves-Select-disabled');
            delete this.$eventsBackuper;

        } else {
            this.$eventsBackuper = new Element('span');
            //backup all events and remove'm.
            this.$eventsBackuper.cloneEvents(this.box);
            this.box.removeEvents();

            this.box.addClass('jarves-Select-disabled');
        }
    },

    /**
     * @returns {boolean}
     */
    isEnabled: function() {
        return  !!this.enabled;
    },

    inject: function(p, p2) {
        this.box.inject(p, p2);

        return this;
    },

    destroy: function() {
        this.chooser.destroy();
        this.box.destroy();
        this.chooser = null;
        this.box = null;
    },

    remove: function(id) {
        var removed = null;
        Array.each(this.items, function(item) {
            if (null !== removed) return;

            if (item.id === id) {
                var pos = this.items.indexOf(item);
                this.items.splice(pos, 1);
                removed = item.id;
                return false;
            }
        }.bind(this));

        if (removed === this.value) {
            this.selectFirst();
        }
    },

    addSplit: function(label) {
        this.items.push({
            label: label,
            isSplit: true
        });

        this.loadItems();
    },

    showOption: function(id) {
        if (!this.hideOptions) {
            this.hideOptions = [];
        }
        this.hideOptions.push(id);
    },

    hideOption: function(id) {
        if (!this.hideOptions) {
            return;
        }
        var idx = this.hideOptions.indexOf(id);
        if (idx === -1) {
            return;
        }
        this.hideOptions.splice(idx, 1);
    },

    addImage: function(pId, pLabel, pImage, pPos) {
        return this.add(pId, [pLabel, pImage], pPos);
    },

    /**
     * Adds a item to the static list.
     *
     * @param {String} pId
     * @param {Mixed}  pLabel String or array ['label', 'imageSrcOr#Class']
     * @param {int}    pPos   Starts with 0
     */
    add: function(pId, pLabel, pPos) {
        if (pPos == 'top') {
            this.items.splice(0, 1, {id: pId, label: pLabel});
        } else if (pPos > 0) {
            this.items.splice(pPos, 1, {id: pId, label: pLabel});
        } else {
            this.items.push({id: pId, label: pLabel});
        }

        if (typeOf(this.value) == 'null' && this.options.selectFirst) {
            this.chooseItem(pId);
        }

        return this.loadItems();
    },

    setLabel: function(pId, pLabel) {

        var i = 0, max = this.items.length;
        do {
            if (this.items[i].id == pId) {
                this.items[i].label = pLabel;
                break;
            }
        } while (++i && i < max);

        if (this.value == pId) {
            this.title.set('html', pLabel);
            this.chooseItem(pId);
        }

    },

    setStyle: function(p, p2) {
        this.box.setStyle(p, p2);
        return this;
    },

    empty: function() {
        this.items = [];
        this.value = null;
        this.title.set('html', '');
        this.chooser.empty();
    },

    getLabel: function(id, callback) {

        var data;

        if ('null' === typeOf(id)) {
            return null;
        }

        if (this.items.length > 0) {
            //search for i
            for (var i = this.items.length - 1; i >= 0; i--) {
                if (id == this.items[i].id) {
                    data = this.items[i];
                    break;
                }
            }
            callback(data);
        } else if (this.options.object || this.options.store) {
            //maybe in objectcache?
            if (this.cachedObjectItems[id]) {
                var item = this.cachedObjectItems[id];
                callback({
                    id: id,
                    label: item
                });
            } else {
                //we need a request
                if (this.lastLabelRequest) {
                    this.lastLabelRequest.cancel();
                }

                if (this.options.object) {
                    this.lastLabelRequest = new Request.JSON({
                        url: _pathAdmin + 'object/' + jarves.normalizeObjectKey(this.options.object) + '/' + jarves.urlEncode(id),
                        onComplete: function(response) {

                            if (!response.error) {

                                if (!response.data) {
                                    return callback(false);
                                }

                                var id = jarves.getObjectUrlId(this.options.object, response.data);
                                callback({
                                    id: id,
                                    label: response.data
                                });
                            }
                        }.bind(this)
                    }).get({
                            fields: this.objectFields.join(',')
                        });
                }
            }
        }
    },

    chooseItem: function(value, internal) {
        this.setValue(value, internal);
    },

    setValue: function(value, internal) {
        if ('object' === typeOf(value) && this.options.object) {
            value = jarves.getObjectId(this.options.object, value);
        }

        this.value = value;

        if (typeOf(this.value) == 'null' || null === this.value) {
            if (!this.options.selectFirstOnNull) {
                return this.title.set('text', '');
            } else {
                return this.selectFirst(null, internal);
            }
        }

        this.getLabel(this.value, function(item) {
            if (typeOf(item) != 'null' && item !== false) {
                this.title.set('html', this.renderLabel(item.label));
            } else {
                this.title.set('text', '');
            }
        }.bind(this));

        if (internal) {
            this.fireChange();
        }

    },

    fireChange: function() {
        this.fireEvent('change', this.getValue());
    },

    getValue: function() {
        return this.value;
    },

    toggle: function() {
        this.toElement().focus();
        if (this.chooser.getParent()) {
            this.close(true);
        } else {
            this.open();
        }
    },

    close: function(internal) {
        this.chooser.dispose();
        this.box.removeClass('jarves-Select-box-open');
        this.reset();

        if (this.backupedTitle !== false) {
            this.title.set('html', this.backupedTitle);
            this.backupedTitle = false;
        }

        if (this.lastOverlay) {
            this.lastOverlay.close();
            delete this.lastOverlay;
        }

        this.title.setStyle('color');
        this.title.inSearchMode = false;
    },

    isOpen: function() {
        return this.box.hasClass('jarves-Select-box-open');
    },

    open: function(pWithoutLoad) {
        if (!this.enabled) {
            return;
        }

        if (this.box.getParent('.jarves-Window-win-titleGroups')) {
            this.chooser.addClass('jarves-Select-darker');
        } else {
            this.chooser.removeClass('jarves-Select-darker');
        }

        this.box.addClass('jarves-Select-box-open');

        this.searchValue = '';

        if (this.lastRq) {
            this.lastRq.cancel();
        }

        if (pWithoutLoad !== true) {
            this.loadItems();
        }
    },

    displayChooser: function() {
        if (!this.lastOverlay) {
            this.lastOverlay = jarves.openDialog({
                element: this.chooser,
                target: this.box,
                onClose: function() {
                    this.close(true);
                }.bind(this),
                offset: {y: -1}
            });
        } else {
            this.lastOverlay.updatePosition();
        }

        if (this.borderLine) {
            this.borderLine.destroy();
        }

        this.box.removeClass('jarves-Select-withBorderLine');

        var csize = this.chooser.getSize();
        var bsize = this.box.getSize();

        if (bsize.x < csize.x) {

            var diff = csize.x - bsize.x;

            this.borderLine = new Element('div', {
                'class': 'jarves-Select-borderline',
                styles: {
                    width: diff
                }
            }).inject(this.chooser);

            this.box.addClass('jarves-Select-withBorderLine');
        } else if (bsize.x - csize.x < 4 && bsize.x - csize.x >= 0) {
            this.box.addClass('jarves-Select-withBorderLine');
        }

        if (window.getSize().y < csize.y) {
            this.chooser.setStyle('height', window.getSize().y);
        }

    },

    toElement: function() {
        return this.box;
    }

});
