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

namespace Jarves\File;

class FileInfo implements FileInfoInterface
{
    use FileInfoTrait;

    const FILE = 'file';
    const DIR = 'dir';

    /**
     * @var string
     */
    private $path;

    /**
     * @var string FileInfo::FILE|FileInfo::DIR
     */
    private $type;

    /**
     * @var string
     */
    private $hash;

    /**
     * @var string
     */
    private $size;

    /**
     * @var integer
     */
    private $createdTime;

    /**
     * @var integer
     */
    private $modifiedTime;

    /**
     * @var boolean
     */
    private $mountPoint = false;

    /**
     * @return array
     */
    public function toArray()
    {
        return [
            'name' => $this->getName(),
            'path' => $this->getPath(),
            'type' => $this->getType(),
            'size' => $this->getSize(),
            'extension' => $this->getExtension(),
            'mimeType' => $this->getMimeType(),
            'createdTime' => $this->getCreatedTime(),
            'modifiedTime' => $this->getModifiedTime()
        ];
    }

    /**
     * @param string $hash
     */
    public function setHash($hash)
    {
        $this->hash = $hash;
    }

    /**
     * @return string
     */
    public function getHash()
    {
        return $this->hash;
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
     * @param string $size
     */
    public function setSize($size)
    {
        $this->size = $size;
    }

    /**
     * @return string
     */
    public function getSize()
    {
        return $this->size;
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
     * @return integer
     */
    public function getCreatedTime()
    {
        return $this->createdTime;
    }

    /**
     * @return integer
     */
    public function getModifiedTime()
    {
        return $this->modifiedTime;
    }

    /**
     * @param int $createdTime
     */
    public function setCreatedTime($createdTime)
    {
        $this->createdTime = $createdTime;
    }

    /**
     * @param int $modifiedTime
     */
    public function setModifiedTime($modifiedTime)
    {
        $this->modifiedTime = $modifiedTime;
    }

    /**
     * @param boolean $mountPoint
     */
    public function setMountPoint($mountPoint)
    {
        $this->mountPoint = $mountPoint;
    }

    /**
     * @return boolean
     */
    public function getMountPoint()
    {
        return $this->mountPoint;
    }

    /**
     * @return bool
     */
    public function isMountPoint()
    {
        return $this->mountPoint;
    }
}