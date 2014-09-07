<?php

namespace Jarves\Configuration;

use Jarves\AssetHandler\AssetInfo;

/**
 * Class Asset
 *
 * Paths are relative to `
 *
 * @bundlePath/Resources/public`.
 */
class Asset extends Model
{
    protected $attributes = ['compression', 'priority'];
    protected $nodeValueVar = 'path';

    /**
     * @var string
     */
    protected $path;

    /**
     * If the asset can be compressed with other equal files (js/css compression)
     *
     * @var bool
     */
    protected $compression = true;

    /**
     * @var int
     */
    protected $priority = 0;

    /**
     * @param boolean $compression
     */
    public function setCompression($compression)
    {
        $this->compression = $this->bool($compression);
    }

    /**
     * @return boolean
     */
    public function getCompression()
    {
        return $this->compression;
    }

    /**
     * @param string $path
     */
    public function setPath($path)
    {
        $this->path = $path;
    }

    /**
     * @return string
     */
    public function getPath()
    {
        return $this->path;
    }

    /**
     * @return AssetInfo
     */
    public function getAssetInfo()
    {
        $assetInfo = new AssetInfo();
        $assetInfo->setPath($this->getPath());
        $assetInfo->setPriority($this->getPriority());
        $assetInfo->setAllowCompression($this->getCompression());
        return $assetInfo;
    }

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
        $this->priority = $priority + 0;
    }

}