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

class FileInfo
{
    use FileInfoTrait;

    const FILE = 'file';
    const DIR = 'dir';

    /**
     * @var integer|null
     */
    private $id;

    /**
     * @var string
     */
    private $path;

    /**
     * @var string FileInfo::FILE|FileInfo::DIR
     */
    private $type = FileInfo::FILE;

    /**
     * @var string
     */
    private $hash;

    /**
     * @var integer
     */
    private $size = 0;

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
     * @var string
     */
    private $publicUrl = '';

    /**
     * @return array
     */
    public function toArray()
    {
        return [
            'id' => $this->getId(),
            'name' => $this->getName() . ($this->getName() !== '/' && $this->getType() == FileInfo::DIR ? '/': ''),
            'path' => $this->getPath(),
            'type' => $this->getType(),
            'size' => $this->getSize(),
            'publicUrl' => $this->getPublicUrl(),
            'extension' => $this->getExtension(),
            'mimeType' => $this->getMimeType(),
            'createdTime' => $this->getCreatedTime(),
            'modifiedTime' => $this->getModifiedTime()
        ];
    }

    public function getName()
    {
        return basename($this->getPath()) ?: '/';
    }

    public function getDir()
    {
        return dirname($this->getPath()) ?: '/';
    }

    public function isDir()
    {
        return 'file' !== $this->getType();
    }

    public function isFile()
    {
        return 'file' === $this->getType();
    }

    public function getIcon()
    {
        return '';
    }

    public function getMimeType()
    {
        $mime_types = array(
            'txt' => 'text/plain',
            'htm' => 'text/html',
            'html' => 'text/html',
            'php' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'xml' => 'application/xml',
            'swf' => 'application/x-shockwave-flash',
            'flv' => 'video/x-flv',
            'png' => 'image/png',
            'jpe' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jpg' => 'image/jpeg',
            'gif' => 'image/gif',
            'bmp' => 'image/bmp',
            'tiff' => 'image/tiff',
            'tif' => 'image/tiff',
            'svg' => 'image/svg+xml',
            'svgz' => 'image/svg+xml',
            'zip' => 'application/zip',
            'rar' => 'application/x-rar-compressed',
            'cab' => 'application/vnd.ms-cab-compressed',
            'mp3' => 'audio/mpeg',
            'qt' => 'video/quicktime',
            'mov' => 'video/quicktime',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pdf' => 'application/pdf',
            'psd' => 'image/vnd.adobe.photoshop',
            'ai' => 'application/postscript',
            'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
            'eps' => 'application/postscript',
            'ps' => 'application/postscript',
            'rtf' => 'application/rtf',
            'exe' => 'application/x-msdownload',
            'msi' => 'application/x-msdownload',
            'xls' => 'application/vnd.ms-excel',
            'doc' => 'application/msword',
            'odt' => 'application/vnd.oasis.opendocument.text',
            'ico' => 'image/vnd.microsoft.icon',
        );

        $path = $this->getExtension();
        if (isset($mime_types[$path])) {
            return $mime_types[$path];
        }
        return null;
    }

    public function getExtension()
    {
        $lastDot = strrpos($this->getName(), '.');
        return false === $lastDot ? null : strtolower(substr($this->getName(), $lastDot + 1));
    }


    /**
     * @return int|null
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * @param int|null $id
     */
    public function setId($id)
    {
        $this->id = $id;
    }

    /**
     * @return string
     */
    public function getPublicUrl()
    {
        return $this->publicUrl;
    }

    /**
     * @param string $publicUrl
     */
    public function setPublicUrl($publicUrl)
    {
        $this->publicUrl = $publicUrl;
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
     * @param int $createdTime unix timestamp
     */
    public function setCreatedTime($createdTime)
    {
        $this->createdTime = $createdTime;
    }

    /**
     * @param int $modifiedTime unix timestamp
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