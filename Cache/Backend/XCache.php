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
