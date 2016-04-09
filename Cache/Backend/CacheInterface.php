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

interface CacheInterface
{

    public function configure(Cache $cacheConfig);

    /**
     * Gets the data for a key.
     *
     * @param  string $key
     *
     * @return mixed
     */
    public function get($key);

    /**
     * Sets data for a key with a timeout.
     *
     * @param  string  $key
     * @param  mixed   $value
     * @param  int     $timeout
     *
     * @return boolean
     */
    public function set($key, $value, $timeout = null);

    /**
     * Deletes data for a key.
     *
     * @param string $key
     */
    public function delete($key);

}
