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

DOMEvent.implement({
    isMiddleClick: function(){
        // Add which for click: 1 === left; 2 === middle; 3 === right
        var button = this.event.button;
        if (!this.event.which && button !== undefined) {
            this.event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
        }
        return 2 === this.event.which;
    }
});
