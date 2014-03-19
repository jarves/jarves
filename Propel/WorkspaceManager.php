<?php

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
