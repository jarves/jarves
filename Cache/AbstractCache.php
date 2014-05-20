<?php

/*
* This file is part of Jarves cms.
*
 * (c) Marc J. Schmidt <marc@jarves.io>
*
* To get the full copyright and license informations, please view the
* LICENSE file, that was distributed with this source code.
*
*/

namespace Jarves\Cache;

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
     * This activates the invalidate() mechanism
     *
     * @type bool
     *
     * If activated, each time get() is called, the function searched
     * for parents based on a exploded string by '/'. If a parent is
     * found is a invalidated cache, the call is ignored and false will be returned.
     * Example: call get('workspace/tables/tableA')
     *          => checks 'workspace/tables' for invalidating (getInvalidate('workspace/tables'))
     *          => if 'workspace/tables' was flagged as invalidate (invalidate('workspace/tables')), return false
     *          => checks 'workspace' for invalidating (getInvalidate('workspace'))
     *          => if 'workspace' was flagged as invalidate (invalidate('workspace')), return false
     * So you can invalidate multiple keys with just one call.
     */
    public $withInvalidationChecks = true;

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
     *
     * @param Cache $cacheConfig The class of the cache service.
     * @param bool $withInvalidationChecks Activates the invalidating mechanism
     *
     * @throws \Exception
     */
    public function __construct(Cache $cacheConfig, $withInvalidationChecks = true)
    {
        $this->withInvalidationChecks = $withInvalidationChecks;

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
     * @param  array   $config
     *
     * @return boolean returns true if everything is fine, if not it should throw an exception with the detailed issue.
     */
    public function testConfig($config)
    {

    }

    /**
     * @return string
     */
    public function getClass()
    {
        return $this->class;
    }

    /**
     * Detects the fastest available cache on current machine.
     *
     * @return Cache
     */
    public static function getFastestCacheClass(Jarves $jarves)
    {
        $class = '\Jarves\Cache\\';

        if (function_exists('apc_store')) {
            $class .= 'Apc';
        } else if (function_exists('xcache_set')) {
            $class .= 'XCache';
        } else if (function_exists('wincache_ucache_get')) {
            $class .= 'WinCache';
        } else {
            $class .= 'Files';
        }

        $cacheConfig = new Cache(null, $jarves);
        $cacheConfig->setClass($class);
        return $cacheConfig;
    }

    /**
     * Gets the data for a key.
     *
     * @param  string $pKey
     *
     * @return mixed
     */
    abstract protected function doGet($pKey);

    /**
     * Sets data for a key with a timeout.
     *
     * @param  string  $pKey
     * @param  mixed   $pValue
     * @param  int     $pTimeout
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
     * @param bool $withoutValidationCheck
     *
     * @return string to data
     */
    public function &get($key, $withoutValidationCheck = false)
    {
        if (!isset($this->cache[$key])) {
            $this->cache[$key] = $this->doGet($key);
            //todo, use event dispatcher \Jarves\Utils::$latency['cache'][] = microtime(true) - $time;
        }

        if (!$this->cache[$key]) {
            $rv = null;
            return $rv;
        }

        if ($this->withInvalidationChecks && !$withoutValidationCheck) {

//            if ($withoutValidationCheck == true) {
//                if (!$this->cache[$key]['value'] || !$this->cache[$key]['time']
//                    || $this->cache[$key]['timeout'] < microtime(true)
//                ) {
//                    $null = null;
//                    return $null;
//                }
//
//                return $this->cache[$key]['value'];
//            }

            //valid cache
            //search if a parent has been flagged as invalid
            if (strpos($key, '/') !== false) {

                $parents = explode('/', $key);
                $code = '';
                if (is_array($parents)) {
                    foreach ($parents as $parent) {
                        $code .= $parent;
                        $invalidateTime = $this->getInvalidate($code);
                        if (is_array($this->cache[$key]) && $invalidateTime && $invalidateTime >= $this->cache[$key]['time']) {
                            $null = null;
                            return $null;
                        }
                        $code .= '/';
                    }
                }
            }
        }

        if ($this->withInvalidationChecks && !$withoutValidationCheck) {
            if (is_array($this->cache[$key])) {
                return $this->cache[$key]['value'];
            } else {
                $null = null;
                return $null;
            }
        } else {
            return $this->cache[$key];
        }

    }

    /**
     * Returns the invalidation time.
     *
     * @param  string $key
     *
     * @return string
     */
    public function getInvalidate($key)
    {
        return doubleval($this->get('invalidate-' . $key, true));
    }

    /**
     * Marks a code as invalidate until $time.
     *
     * @param string $key
     * @param bool|int $time
     */
    public function invalidate($key, $time = null)
    {
        $this->cache['invalidate-' . $key] = $time;

        $result = $this->doSet('invalidate-' . $key, $time);
        return $result;
    }

    /**
     * Stores data to the specified cache-key.
     *
     * If you want to save php class objects, you should serialize it before.
     *
     * @param string $key
     * @param mixed $value
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

        if ($this->withInvalidationChecks && !$withoutValidationData) {
            $value = array(
                'timeout' => microtime(true) + $lifeTime,
                'time' => microtime(true),
                'value' => $value
            );
        }

        $this->cache[$key] = $value;

        $result = $this->doSet($key, $value, $lifeTime);
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
