<?php

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
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    public function clearCache()
    {
//        \Jarves\TempFile::remove('cache-object');
//        \Jarves\TempFile::remove('smarty-compile');
//
//        \Jarves\WebFile::remove('cache');
//        \Jarves\WebFile::createFolder('cache');

        foreach ($this->getJarves()->getKernel()->getBundles() as $bundleName => $bundle) {
            $this->clearBundleCache($bundleName);
        }

        return true;
    }

    public function clearBundleCache($bundleName)
    {
        $config = $this->getJarves()->getKernel()->getBundle($bundleName);

        if ($config) {
            $this->getJarves()->invalidateCache(strtolower($config->getName()));
        }
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
        $config = $this->getJarves()->getConfig($bundleName);

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
