<?php

namespace Jarves\Cache;

class XCache extends AbstractCache
{
    /**
     * {@inheritdoc}
     */
    public function testConfig($config)
    {
        if (!function_exists('xcache_set')) {
            throw new \Exception('The module Apc is not activated in your PHP environment.');
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doGet($key)
    {
        return xcache_get($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function doSet($key, $value, $timeout = null)
    {
        return xcache_set($key, $value, $timeout);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($key)
    {
        return xcache_unset($key);
    }
}
