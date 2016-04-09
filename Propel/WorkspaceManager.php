<?php
/**
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

namespace Jarves\Propel;

//TODO all

class WorkspaceManager
{
    private static $current = 1;

    public static function getCurrent()
    {
        return static::$current;
    }

    public static function setCurrent($id)
    {
        static::$current = $id;
    }

}
