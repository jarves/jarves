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

class AssetInfo
{
    /**
     * @var string
     */
    protected $path;

    /**
     * @var string
     */
    protected $originalPath;

    /**
     * @var string
     */
    protected $content;

    /**
     * Mimetype
     *
     * @var string
     */
    protected $contentType;

    /**
     * Additional information
     *
     * @var array
     */
    protected $additionalData;

    /**
     * @var boolean
     */
    protected $allowCompression = true;

    /**
     * @var int
     */
    protected $priority = 0;

    /**
     * @param string $key
     * @param $data
     */
    public function set($key, $data)
    {
        $this->additionalData[$key] = $data;
    }

    /**
     * @param string $key
     * @return mixed
     */
    public function get($key)
    {
        return @$this->additionalData[$key];
    }

    /**
     * @param string $originalFile
     */
    public function setOriginalPath($originalFile)
    {
        $this->originalPath = $originalFile;
    }

    /**
     * @return string
     */
    public function getOriginalPath()
    {
        return $this->originalPath;
    }

    /**
     * @param string $content
     */
    public function setContent($content)
    {
        $this->content = $content;
    }

    /**
     * @return string
     */
    public function getContent()
    {
        return $this->content;
    }

    /**
     * @param string $contentType
     */
    public function setContentType($contentType)
    {
        $this->contentType = $contentType;
    }

    /**
     * @return string
     */
    public function getContentType()
    {
        return $this->contentType;
    }

    /**
     * @param string $file
     */
    public function setPath($file)
    {
        $this->path = $file;
    }

    /**
     * @return string
     */
    public function getPath()
    {
        return $this->path;
    }

    /**
     * @param boolean $allowCompression
     */
    public function setAllowCompression($allowCompression)
    {
        $this->allowCompression = filter_var($allowCompression, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return boolean
     */
    public function getAllowCompression()
    {
        return $this->allowCompression;
    }

    public function isCompressionAllowed()
    {
        return !!$this->allowCompression;
    }

    /**
     * Returns true if this is a javascript asset.
     *
     * @return bool
     */
    public function isJavaScript()
    {
        if ($this->getContentType()) {
            return 'text/javascript' === strtolower($this->getContentType());
        }

        if ($this->getPath()) {
            $exploded = explode('.', $this->getPath());
            return 'js' === strtolower(array_pop($exploded));
        }

        return false;
    }

    /**
     * Returns true if this is a typescript asset.
     *
     * @return bool
     */
    public function isTypeScript()
    {
        if ($this->getContentType()) {
            return 'text/typescript' === strtolower($this->getContentType());
        }

        if ($this->getPath()) {
            $exploded = explode('.', $this->getPath());
            return 'ts' === strtolower(array_pop($exploded));
        }

        return false;
    }

    /**
     * Returns true if this is a stylesheet asset.
     *
     * @return bool
     */
    public function isStylesheet()
    {
        if ($this->getContentType()) {
            return 'text/css' === strtolower($this->getContentType());
        }

        if ($this->getPath()) {
            $exploded = explode('.', $this->getPath());
            return 'css' === strtolower(array_pop($exploded));
        }

        return false;
    }

    /**
     * Returns true if this is a stylesheet asset.
     *
     * @return bool
     */
    public function isScss()
    {
        if ($this->getContentType()) {
            return 'text/scss' === strtolower($this->getContentType());
        }

        if ($this->getPath()) {
            $exploded = explode('.', $this->getPath());
            return 'scss' === strtolower(array_pop($exploded));
        }

        return false;
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
        $this->priority = $priority;
    }

}