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

namespace Jarves\Admin;

use Jarves\Configuration\EntryPoint;
use Jarves\Jarves;

class Utils
{
    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct($jarves)
    {
        $this->jarves = $jarves;
    }
    /**
     * Gets the item from the administration entry points defined in the config.json, by the given code.
     *
     * @param string  $code <bundleName>/news/foo/bar/edit
     *
     * @return EntryPoint
     */
    public function getEntryPoint($code)
    {
        if ('/' === $code) return null;

        $path = $code;
        if (substr($code, 0, 1) == '/') {
            $code = substr($code, 1);
        }

        if (false === strpos($code, '/')) {
            $path = '';
        }

        $bundleName = $code;
        if (false !== (strpos($code, '/'))) {
            $bundleName = substr($code, 0, strpos($code, '/'));
            $path = substr($code, strpos($code, '/') + 1);
        }

        //$bundleName = ucfirst($bundleName) . 'Bundle';
        $config = $this->jarves->getConfig($bundleName);

        if (!$path && $config) {
            //root
            $entryPoint = new EntryPoint();
            $entryPoint->setType(0);
            $entryPoint->setPath($code);
            $entryPoint->setChildren(
                $config->getEntryPoints()
            );
            $entryPoint->setBundle($config);
            return $entryPoint;
        }

        $entryPoint = null;
        if ($config) {

            while (!($entryPoint = $config->getEntryPoint($path))) {
                if (false === strpos($path, '/')) {
                    break;
                }
                $path = substr($path, 0, strrpos($path, '/'));
            };
        }

        return $entryPoint;
    }
}
