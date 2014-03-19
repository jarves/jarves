/*
 ---
 description: String.sprintf

 license: MIT-style

 authors:
 - MArc J. Schmidt

 requires:
 - Core
 - More 'String.Extra'

 provides: [String.sprintf]

 ...
 */

/**
 * String.sprintf
 *
 * A sprintf function in mootools.
 *
 * Copyright (c) MArc J. Schmidt, <http://marcschmidt.name/>
 *
 */
(function () {

    function sprintf () {

        var args = arguments,
            text = this,         //buffer of origin text
            arg,                   //current argument item
            found,                 //position of current % char
            cursorPosition = 0,    //position of current position of origin text
            result = '',           //buffer of parsed text
            code = '',           //buffer for char(s) behind %
            opt = '',           //buffer for optional code parameter
            number = 0,            //buffer for the number value
            autoPosition = 0;      //position of current item position in args

        while ((found = text.indexOf('%', cursorPosition)) !== -1) {

            result += text.substring(cursorPosition, found);

            code = text.substr(found + 1).match(/(?:([0-9]+)\$|)('.+\-?|\-?[0-9\.]*|)([%bcdeEufgGosxX])/);
            // ->
            //  1 = argument numbering
            //  2 = optional parameter
            //  3 = code
            //

            if (!code) {
                cursorPosition++;
                continue;
            }

            cursorPosition = found + 1 + code[0].length;

            //if argument numbering/swapping
            if (code[1]) {
                arg = args[parseInt(code[1]) - 1];
            } else if (code[3] !== '%') {
                //default code, so we move position + 1
                arg = args[autoPosition++];
            }

            //d, f, u
            if (code[3] == 'd' || code[3] == 'f' || code[3] == 'u') {
                number = Number.from(arg) || 0;
                if (code[2] && (opt = parseInt(code[2]) - String.from(number.toFixed(0)).length) > 0) {
                    result += '0'.repeat(opt);
                }
            }

            if (code[3] == 's') {
                var character = '';
                if (code[2]) {

                    if (code[2].substr(0, 1) == '\'') {
                        character = code[2].substr(1, 1);
                        opt = 2;
                    } else {
                        opt = code[2].search(/[\-1-9]/);
                        character = code[2].substr(0, opt) || ' ';
                    }

                    opt = code[2].substr(opt, code[2].length);

                    //truncate
                    if (parseFloat(opt) % 1) {
                        arg = String.from(arg).substr(0, parseInt(opt.substr(opt.indexOf('.') + 1)));
                    }

                    opt = parseFloat(opt);

                    if (opt < 0 && (opt * -1) - arg.length > 0) {
                        result += character.repeat(parseInt((opt * -1) - arg.length));
                    }
                }

                result += String.from(arg);

                if (opt > 0 && opt - arg.length > 0) {
                    result += character.repeat(parseInt(opt - arg.length));
                }

                continue;
            }

            switch (code[3]) {
                case '%':
                    result += '%';
                    break;
                case 'b':
                    result += (Number.from(arg) || 0).toString(2);
                    break;
                case 'c':
                    result += String.fromCharCode(Number.from(arg) || 0);
                    break;
                case 'd':
                    result += number.toFixed(0);
                    break;
                case 'e':
                    result += (Number.from(arg) || 0).toExponential();
                    break;
                case 'E':
                    result += (Number.from(arg) || 0).toExponential().toUpperCase();
                    break;
                case 'u':
                    result += number >>> 0;
                    break;
                case 'f':
                    result += number.toFixed((code[2] ? code[2].substr(code[2].indexOf('.') + 1) : 6));
                    break;
                case 'o':
                    result += (Number.from(arg) || 0).toString(8);
                    break;
                case 'x':
                    result += (Number.from(arg) || 0).toString(16);
                    break;
                case 'X':
                    result += (Number.from(arg) || 0).toString(16).toUpperCase();
                    break;
            }

        }

        result += text.substr(cursorPosition);

        return result;
    }

    String.implement({
        'sprintf': sprintf
    });

})();