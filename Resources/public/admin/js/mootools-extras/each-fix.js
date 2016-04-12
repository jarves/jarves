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

/**
 * Mootools Array.each iterate over `undefined` as well and include the `window` object in the callback as item.
 * This fixes it.
 */
(function() {
    var oldArrayEach = Array.each;
    Array.each = function (arg1, arg2, arg3) {
        if ('undefined' === typeof arg1) {
            return undefined;
        }

        return oldArrayEach(arg1, arg2, arg3);
    };
    
    var oldObjectEach = Object.each;
    Object.each = function (arg1, arg2, arg3) {
        if ('undefined' === typeof arg1) {
            return undefined;
        }

        return oldObjectEach(arg1, arg2, arg3);
    };
})();