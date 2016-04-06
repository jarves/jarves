<?php

namespace Jarves\Cache\Backend;

class WinCache extends AbstractCache
{
    /**
     * {@inheritdoc}
     */
    public function testConfig($config)
    {
        if (!function_exists('wincache_ucache_get')) {
            throw new \Exception('The PECL wincache >= 1.1.0 is not activated in your PHP environment.');
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doGet($key)
    {
        return wincache_ucache_get($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function doSet($key, $value, $timeout = null)
    {
        return wincache_ucache_set($key, $value, $timeout);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($key)
    {
        return wincache_ucache_delete($key);
    }
}
