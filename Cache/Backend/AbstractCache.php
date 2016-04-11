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

namespace Jarves\Cache\Backend;

use Jarves\Configuration\Cache;
use Jarves\Jarves;

/**
 * Cache controller
 */
abstract class AbstractCache implements CacheInterface
{
    /**
     * Contains the current class instance.
     *
     * @type Object
     */
    public $instance;

    /**
     * All gets/sets will be cached in this array for faster access
     * during multiple get() calls on the same key.
     *
     * @var array
     */
    public $cache = array();

    /**
     * All config values as array.
     *
     * @var array
     */
    protected $config;

    /**
     * @var Cache
     */
    protected $cacheConfig;

    /**
     * @var
     */
    protected $eventDispatcher;

    /**
     * Constructor.
     */
    public function __construct()
    {
    }

    public function configure(Cache $cacheConfig)
    {
        $this->cacheConfig = $cacheConfig;
        $this->config = $cacheConfig->getOptions()->toArray();
        $this->testConfig($this->config);
        $this->setup($this->config);
    }

    /**
     * @param mixed $eventDispatcher
     */
    public function setEventDispatcher($eventDispatcher)
    {
        $this->eventDispatcher = $eventDispatcher;
    }

    /**
     * @return mixed
     */
    public function getEventDispatcher()
    {
        return $this->eventDispatcher;
    }


    /**
     * Connects to Server, prepared Folder structure, etc.
     */
    public function setup($config)
    {

    }

    /**
     * Test the cache driver whether the config values are correct and useable or not.
     * This should also check whether the driver can be used in general or not (like if a necessary php module
     * is loaded or not).
     *
     * @param  array $config
     *
     * @return boolean returns true if everything is fine, if not it should throw an exception with the detailed issue.
     */
    public function testConfig($config)
    {

    }

    /**
     * Gets the data for a key.
     *
     * @param  string $pKey
     *
     * @return mixed|false return false when cache does not exist
     */
    abstract protected function doGet($pKey);

    /**
     * Sets data for a key with a timeout.
     *
     * @param  string $pKey
     * @param  mixed $pValue
     * @param  int $pTimeout
     *
     * @return boolean
     */
    abstract protected function doSet($pKey, $pValue, $pTimeout = null);

    /**
     * Deletes data for a key.
     *
     * @param string $pKey
     */
    abstract protected function doDelete($pKey);

    /**
     * Returns data of the specified cache-key.
     *
     * @param string $key
     *
     * @return mixed
     */
    public function get($key)
    {
        if (isset($this->cache[$key])) {
            return $this->cache[$key];
        }

        $cache = $this->doGet($key);

        if (false === $cache) {
            return null;
        }

        $this->cache[$key] = json_decode($cache, true);

        return $this->cache[$key];
    }

    /**
     * Returns latest invalidation timestamp for the given $key.
     *
     * Returns an timestamp as integer which tells the cache handler that all stored caches
     * before this timestamp are automatically invalidated.
     *
     * @param string $key
     *
     * @return integer|null
     */
    public function getInvalidate($key)
    {
        //do not use internal $cache here, because invalidation should come from one single point of truth.
        return doubleval($this->doGet('invalidate-' . $key));
    }

    /**
     * Marks a code as invalidate until $time.
     *
     * @param string $key
     * @param bool|int $time
     *
     * @return bool
     */
    public function invalidate($key, $time = null)
    {
        if (!$time) {
            $time = microtime(true);
        }

        $result = $this->doSet('invalidate-' . $key, $time);
        return $result;
    }

    /**
     * Removes a invalidation
     *
     * @param string $key
     */
    public function deleteInvalidate($key)
    {
        $this->doDelete('invalidate-' . $key);
    }

    /**
     * Stores data to the specified cache-key.
     *
     * If you want to save php class objects, you should serialize it before.
     *
     * @param string $key
     * @param mixed $value Do not pass objects, use serialize if you want to store php objects
     * @param int $lifeTime In seconds. Default is one hour
     * @param bool $withoutValidationData
     *
     * @return boolean
     */
    public function set($key, $value, $lifeTime = 3600, $withoutValidationData = false)
    {
        if (!$key) {
            return false;
        }

        if (!$lifeTime) {
            $lifeTime = 3600;
        }

        $this->cache[$key] = $value;

        $result = $this->doSet($key, json_encode($value), $lifeTime);
        return $result;
    }

    /**
     * Deletes the cache for specified cache-key.
     *
     * @param  string $key
     *
     * @return bool
     */
    public function delete($key)
    {
        unset($this->cache[$key]);

        return $this->doDelete($key);
    }
}
