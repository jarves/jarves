<?php

namespace Jarves\Configuration;

class Cache extends Model
{
    protected $docBlock = '
  The cache layer we use for the distributed caching.
  (The `fast caching` is auto determined (Order: APC, XCache, Files))
  ';

    protected $docBlocks = [
        'class' => 'The full classname of the storage. MUST have `Core\Cache\CacheInterface` as interface.'
    ];


    /**
     * @var string
     */
    protected $class = '\Jarves\Cache\Files';

    /**
     * @var Options
     */
    protected $options;

    /**
     * @param Options $options
     */
    public function setOptions(Options $options = null)
    {
        $this->options = $options;
    }

    public function setOption($key, $value)
    {
        $this->getOptions()->setOption($key, $value);
    }

    public function getOption($key)
    {
        return $this->getOptions()->getOption($key);
    }

    /**
     * @return Options
     */
    public function getOptions()
    {
        if (null === $this->options) {
            $this->options = new Options(null, $this->getJarves());
        }
        return $this->options;
    }

    /**
     * @param string $class
     */
    public function setClass($class)
    {
        $this->class = $class;
    }

    /**
     * @return string
     */
    public function getClass()
    {
        return $this->class;
    }

}