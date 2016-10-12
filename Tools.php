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

namespace Jarves;

class Tools {

    public static function underscore2Camelcase($value)
    {
        return static::char2Camelcase($value, '_');
    }

    public static function char2Camelcase($value, $char = '_')
    {
        $ex = explode($char, $value);
        $return = '';
        foreach ($ex as $str) {
            $return .= ucfirst($str);
        }

        return $return;
    }

    public static function camelcase2Underscore($value)
    {
        return static::camelcase2Char($value, '_');
    }

    public static function camelcase2Char($value, $char = '_')
    {
        return strtolower(preg_replace('/([a-z0-9])([A-Z])/', '$1' . $char . '$2', $value));
    }

    public static function indentString($string, $size = 2, $char = ' ')
    {
        return preg_replace('/^/mu', str_repeat($char, $size), $string);
    }

    public static function getArrayTrace($exception)
    {
        $trace = [];
        foreach ($exception->getTrace() as $t) {
            $args = [];
            foreach ((array)@$t['args'] as $arg) {
                $args[] = gettype($arg);
            }

            $trace[] = [
                'function' => @$t['function'],
                'class' => @$t['class'],
                'file' => @$t['file'],
                'line' => @$t['line'],
                'type' => @$t['type'],
                'args' => $args,
            ];
        }

        return $trace;
    }

    /**
     * Returns the lowercased file extension of $path.
     *
     * @param string $path
     *
     * @return string|boolean false if not '.' is present in $path.
     */
    public static function getFileExtension($path)
    {
        $paths = explode('.', strtolower($path));
        return $paths ? array_pop($paths) : false;
    }

    /**
     * @param string $string a comma separated list of values
     * @return array
     */
    public static function listToArray($string)
    {
        if (is_string($string)) {
            $array = !$string ? [] : array_unique(
                explode(',', trim(preg_replace('/[^a-zA-Z0-9_\.\-,\*]/', '', $string)))
            );
        } else if (is_array($string)) {
            $array = $string;
        } else {
            return [];
        }
        return array_keys(array_flip($array));
    }

    /**
     * @param array|string $array array or comma separated list
     * @param array|string $blacklist array or comma separated list
     * @return array
     */
    public static function filterArrayByBlacklist($array, $blacklist)
    {
        $array = static::listToArray($array);
        $blacklist = static::listToArray($blacklist);
        $blacklistIndexed = array_flip($blacklist);

        foreach ($array as $idx => $item) {
            if (isset($blacklistIndexed[$item])) {
                unset($array[$idx]);
            }
        }

        return $array;
    }

    /**
     * Returns the value of a $dotPath in $array.
     *
     * (['a' => ['b' => 5]], 'a.b') = 5
     *
     * @param array $array
     * @param string $dotPath
     *
     * @return mixed
     */
    public static function getArrayPath($array, $dotPath)
    {
        $path = explode('.', $dotPath);
        foreach ($path as $p) {
            if (isset($array[$p])) {
                $array = $array[$p];
            } else {
                return null;
            }
        }

        return $array;
    }

    /**
     * Sets the value of a $dotPath in $array.
     *
     * (['a' => ['b' => 5]], 'a.b', 6) = ['a' => ['b' => 6]]
     *
     *
     * @param array &$array
     * @param string $dotPath
     * @param mixed $value
     *
     * @return mixed
     */
    public static function setArrayPath(&$array, $dotPath, $value)
    {
        $path = explode('.', $dotPath);
        foreach ($path as $p) {
            if (!isset($array[$p])) {
                $array[$p] = [];
            }
            $array = &$array[$p];
        }

        $array = $value;
    }

    /**
     * Returns a relative path from $path to $current.
     *
     * @param string $from
     * @param string $to relative to this
     *
     * @return string relative path without trailing slash
     */
    public static function getRelativePath($from, $to)
    {
        $from = '/' . trim($from, '/');
        $to = '/' . trim($to, '/');

        if (0 === $pos = strpos($from, $to)) {
            return substr($from, strlen($to) + ('/' === $to ? 0 : 1));
        }

        $result = '';
        while ($to && false === strpos($from, $to)) {
            $result .= '../';
            $to = substr($to, 0, strrpos($to, '/'));
        }

        return !$to /*we reached root*/ ? $result . substr($from, 1) : $result. substr($from, strlen($to) + 1);
    }

    public static function dbQuote($value, $table = '')
    {
        if (is_array($value)) {
            foreach ($value as &$v) {
                $v = static::dbQuote($v);
            }

            return $value;
        }
        if (strpos($value, ',') !== false) {
            $values = explode(',', str_replace(' ', '', $value));
            $values = static::dbQuote($values);

            return implode(', ', $values);
        }

        if ($table && strpos($value, '.') === false) {
            return static::dbQuote($table) . '.' . static::dbQuote($value);
        }

        return preg_replace('/[^a-zA-Z0-9-_]/', '', $value);;
    }


    public static function urlEncode($string)
    {
        $string = rawurlencode($string);
        $string = str_replace('%2F', '%252F', $string);
        return $string;
    }

    public static function urlDecode($string)
    {
        $string = str_replace('%252F', '%2F', $string);
        return rawurldecode($string);
    }

}
