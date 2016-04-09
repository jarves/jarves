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

jarves.MultiValue = new Class({
    mainValue: null,
    additionalValues: {},

    initialize: function(mainValue, additionalValues) {
        this.mainValue = mainValue;
        this.additionalValues = typeOf(additionalValues) === 'object' ? additionalValues : {};
    }
});