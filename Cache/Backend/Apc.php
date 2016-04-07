<?php

namespace Jarves\Cache\Backend;

class Apc extends AbstractCache
{
    /**
     * {@inheritdoc}
     */
    protected function doGet($key)
    {
        return @apc_fetch($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function doSet($key, $value, $timeout = null)
    {
        return apc_store($key, $value, $timeout);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($key)
    {
        return apc_delete($key);
    }

    /**
     * {@inheritdoc}
     */
    public function testConfig($config)
    {
        if (!function_exists('apc_store')) {
            throw new \Exception('The module Apc is not activated in your PHP environment.');
        }

        return true;
    }
}
