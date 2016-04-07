<?php

namespace Jarves\Cache\Backend;

use Jarves\Configuration\Cache;
use Jarves\Jarves;
use Jarves\JarvesConfig;
use Symfony\Component\DependencyInjection\ContainerInterface;

class Factory
{
    /**
     * @param ContainerInterface $container
     * @return CacheInterface
     * @internal param Jarves $jarves
     *
     */
    public static function createFast(ContainerInterface $container)
    {
        $service = 'jarves.cache.backend.';

        if (function_exists('apc_store')) {
            $service .= 'apc';
        } else if (function_exists('xcache_set')) {
            $service .= 'xcache';
        } else if (function_exists('wincache_ucache_get')) {
            $service .= 'wincache';
        } else {
            $service .= 'files';
        }

        $cacheConfig = new Cache();

        /** @var CacheInterface $instance */
        $instance = $container->get($service);
        $instance->configure($cacheConfig);
        return $instance;
    }

    /**
     * @param ContainerInterface $container
     * @param JarvesConfig $jarvesConfig
     * @return CacheInterface
     */
    public static function createDistributed(ContainerInterface $container, JarvesConfig $jarvesConfig)
    {
        $cacheConfig = $jarvesConfig->getSystemConfig()->getCache(true);
        $service = $cacheConfig->getService();

        /** @var CacheInterface $instance */
        $instance = $container->get($service);
        $instance->configure($cacheConfig);
        return $instance;
    }
}