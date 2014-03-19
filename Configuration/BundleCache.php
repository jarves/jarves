<?php

namespace Jarves\Configuration;

class BundleCache extends Model
{
    protected $rootName = 'cache';
    protected $attributes = ['method'];
    protected $nodeValueVar = 'key';

    /**
     * @var string
     */
    protected $key;

    /**
     * @var string
     */
    protected $method;

    /**
     * @param string $key
     */
    public function setKey($key)
    {
        $this->key = $key;
    }

    /**
     * @return string
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * @param string $method
     */
    public function setMethod($method)
    {
        $this->method = $method;
    }

    /**
     * @return string
     */
    public function getMethod()
    {
        return $this->method;
    }
}