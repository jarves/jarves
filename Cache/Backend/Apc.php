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
