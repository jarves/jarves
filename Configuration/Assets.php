<?php

namespace Jarves\Configuration;

use Symfony\Component\Finder\Finder;

/**
 * Class Asset
 *
 * Paths are relative to `
 *
 * @bundlePath/Resources/public`.
 */
class Assets extends Model implements \IteratorAggregate
{
    protected $attributes = ['recursive', 'compression', 'type', 'priority', 'src'];

    /**
     * @var string
     */
    protected $src;

    /**
     * @var Asset[]
     */
    private $assets;

    /**
     * If assets can be compressed with other equal files (js/css compression)
     *
     * @var bool
     */
    protected $compression = true;

    /**
     * @var bool
     */
    protected $recursive = false;

    /**
     * @var string
     */
    protected $type;

    /**
     * @var int
     */
    protected $priority;

    /**
     * @return int
     */
    public function getPriority()
    {
        return $this->priority;
    }

    /**
     * @param int $priority
     */
    public function setPriority($priority)
    {
        $this->priority = $priority;
    }

    /**
     * @param string $type
     */
    public function setType($type)
    {
        $this->type = $type;
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @param boolean $compression
     */
    public function setCompression($compression)
    {
        $this->compression = filter_var($compression, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return boolean
     */
    public function getCompression()
    {
        return $this->compression;
    }

    /**
     * @param string $src
     */
    public function setSrc($src)
    {
        $this->src = $src;
    }

    /**
     * @return string
     */
    public function getSrc()
    {
        return $this->src;
    }

    /**
     * @param boolean $recursive
     */
    public function setRecursive($recursive)
    {
        $this->recursive = $recursive;
    }

    /**
     * @return boolean
     */
    public function getRecursive()
    {
        return $this->recursive;
    }

    /**
     * @return Asset[]
     */
    public function getAssets()
    {
        if (null === $this->assets) {
            preg_match('/(\@[a-zA-Z0-9\-_\.\\\\]+)/', $this->getSrc(), $match);

            $bundleName = $match ? $match[1] : '';
            $prefixPath = $bundleName ? $this->getJarves()->resolvePath("$bundleName/Resources/public/") : '';
            $offset = strlen($prefixPath);

            $path = $this->getJarves()->resolveInternalPublicPath($this->getSrc());
            if (!$path) {
                return [];
            }
            $files = Finder::create()
                ->name(basename($path))
                ->files()
                ->depth(!$this->getRecursive() ? '== 0' : null)
                ->in(dirname($path))
                ->sortByName();

            foreach ($files as $file) {
                $asset = new Asset(null, $this->getJarves());
                $file = ($bundleName ? $bundleName : '') . substr($file->getPathName(), $offset);
                $asset->setSrc($file);
                $asset->setType($this->getType());
                $asset->setPriority($this->getPriority());
                $asset->setCompression($this->getCompression());
                $this->assets[] = $asset;
            }
        }

        return $this->assets;
    }

    public function getIterator()
    {
        return new \ArrayIterator($this->getAssets() ? : array());
    }

}