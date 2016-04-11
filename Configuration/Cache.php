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

namespace Jarves\Configuration;

class Cache extends Model
{
    protected $docBlock = '
  The cache layer we use for the distributed caching.
  (The `fast caching` is auto determined (Order: APC, XCache, Files))

  service: MUST have `Core\Cache\CacheInterface` as interface
  ';

    protected $attributes = ['service'];

    /**
     * @var string
     */
    protected $service = 'jarves.cache.backend.files';

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
     * @param string $service
     */
    public function setService($service)
    {
        $this->service = $service;
    }

    /**
     * @return string
     */
    public function getService()
    {
        return $this->service;
    }

}