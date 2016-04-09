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

jarves.Slider = new Class({

    Implements: [Events, Options],

    options: {
        width: 50,
        snap: true,
        steps: 100,
        initialStep: 0,
        mode: 'horizontal',
        wheel: true
    },

    initialize: function (pContainer, pOptions) {
        this.setOptions(pOptions);

        this.box = new Element('div', {
            'class': 'jarves-Slider',
            styles: {
                width: this.options.width
            }
        });

        this.boxLine = new Element('div', {
            'class': 'jarves-Slider-line'
        }).inject(this.box);

        this.knob = new Element('a', {
            'class': 'jarves-Slider-knob',
            href: 'javascript: ;'
        }).inject(this.box);

        if (pContainer) {
            this.box.inject(pContainer);
        }

        this.slider = new Slider(this.box, this.knob, this.options);

        this.slider.addEvent('change', function(step){
            this.value = step;
            this.fireEvent('change', step);
        }.bind(this));
    },

    toElement: function () {
        return this.box;
    },

    getValue: function () {
        return this.value;
    },

    setValue: function (p) {
        this.value = p;
        this.slider.set(p);
    }

});