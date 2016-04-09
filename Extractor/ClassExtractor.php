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

namespace Jarves\Extractor;

class ClassExtractor
{
    private $obj;

    public function __construct($obj)
    {
        $this->obj = $obj;
    }

    /**
     * @param object $obj
     * @return static
     */
    public static function create($obj)
    {
        return new static($obj);
    }

    public function getPropertyComment($property)
    {
        $propertyReflection = new \ReflectionProperty($this->obj, $property);
        if ($comment = $propertyReflection->getDocComment()) {
            return $this->cleanDocComment($comment);
        }

        return null;
    }

    /**
     * @return string
     */
    public function getShortClassName()
    {
        return (new \ReflectionClass($this->obj))->getShortName();
    }

    /**
     * @param string $className
     * @return bool
     */
    public function instanceOfClass($className)
    {
        return (new \ReflectionClass($this->obj))->isSubclassOf($className);
    }

    /**
     * @return string
     */
    public function getClassName()
    {
        return (new \ReflectionClass($this->obj))->getName();
    }

    public function cleanDocComment($comment)
    {
        //start
        $comment = preg_replace('/^\s*\/\*\*$/mu', '', $comment);
        $comment = preg_replace('/^\s*\/\*\s*/m', '', $comment);

        $comment = trim($comment);

        //detect how much spaces need to be removed
        preg_match('/^\s*\*([ \t]*)/', $comment, $matches);
        $cut = 0;
        if (isset($matches[1])) {
            $cut = strlen($matches[1]);
        }

        //middle
        // {' . $cut . '}
        $comment = preg_replace('/^[ \t]*\*[ \t]{' . $cut . '}/m', '', $comment);
        $comment = preg_replace('/^[ \t]*\*$/m', '', $comment);

        //end
        $comment = preg_replace('/^\s*\*\//mu', '', $comment);
        return rtrim($comment);
    }
}