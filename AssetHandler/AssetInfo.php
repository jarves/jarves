<?php

namespace Jarves\AssetHandler;

class AssetInfo
{
    /**
     * @var string
     */
    protected $file;

    /**
     * @var string
     */
    protected $originalFile;

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
    public function setOriginalFile($originalFile)
    {
        $this->originalFile = $originalFile;
    }

    /**
     * @return string
     */
    public function getOriginalFile()
    {
        return $this->originalFile;
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
    public function setFile($file)
    {
        $this->file = $file;
    }

    /**
     * @return string
     */
    public function getFile()
    {
        return $this->file;
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

        if ($this->getFile()) {
            $exploded = explode('.', $this->getFile());
            return 'js' === strtolower(array_pop($exploded));
        }

        return false;
    }

    /**
     * Returns true fi this is a stylesheet asset.
     *
     * @return bool
     */
    public function isStylesheet()
    {
        if ($this->getContentType()) {
            return 'text/css' === strtolower($this->getContentType());
        }

        if ($this->getFile()) {
            $exploded = explode('.', $this->getFile());
            return 'css' === strtolower(array_pop($exploded));
        }
    }

}