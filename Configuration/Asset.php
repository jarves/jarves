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
    protected $attributes = ['compression'];
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
        $assetInfo->setFile($this->getPath());
        $assetInfo->setAllowCompression($this->getCompression());
        return $assetInfo;
    }
}