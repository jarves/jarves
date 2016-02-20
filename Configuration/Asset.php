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
    protected $attributes = ['compression', 'priority', 'type'];
    protected $nodeValueVar = 'content';

    /**
     * @var string
     */
    protected $src;

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
     * @var string
     */
    protected $type;

    /**
     * @var string
     */
    protected $content;

    /**
     * @return string
     */
    public function getContent()
    {
        return $this->content;
    }

    /**
     * @param string $content
     */
    public function setContent($content)
    {
        $this->content = $content;
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
     * @return AssetInfo
     */
    public function getAssetInfo()
    {
        $assetInfo = new AssetInfo();
        $assetInfo->setPath($this->getSrc());
        $assetInfo->setPriority($this->getPriority());
        $assetInfo->setAllowCompression($this->getCompression());
        $assetInfo->setContentType($this->getType());
        $assetInfo->setContent($this->getContent());
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