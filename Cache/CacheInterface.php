<?php

namespace Jarves\Cache;

interface CacheInterface
{
    /**
     * Gets the data for a key.
     *
     * @param  string $key
     *
     * @return mixed
     */
    function get($key);

    /**
     * Sets data for a key with a timeout.
     *
     * @param  string  $key
     * @param  mixed   $value
     * @param  int     $timeout
     *
     * @return boolean
     */
    function set($key, $value, $timeout = null);

    /**
     * Deletes data for a key.
     *
     * @param string $key
     */
    function delete($key);

}
