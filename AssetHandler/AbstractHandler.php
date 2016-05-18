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

namespace Jarves\AssetHandler;

use Jarves\Jarves;
use Jarves\Exceptions\BundleNotFoundException;

abstract class AbstractHandler
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @param Jarves $jarves
     */
    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @param \Jarves\Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return \Jarves\Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    /**
     * Returns local full file path.
     *
     * @param string $path
     * @return string
     */
    protected function getAssetPath($path)
    {
        return realpath($this->getJarves()->getRootDir() . '/../') . '/' . $this->getJarves()->resolveWebPath($path);
    }

    /**
     *
     * @param string $path
     * @return string
     */
    protected function getPublicAssetPath($path)
    {
        return $this->getJarves()->resolvePublicWebPath($path);
    }
}