<?php

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
     * Returns relative file path.
     *
     * @param string $path
     * @return string
     */
    protected function getAssetPath($path)
    {
        return $this->getJarves()->resolveWebPath($path);
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