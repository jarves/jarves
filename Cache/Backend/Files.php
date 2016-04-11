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

class Files extends AbstractCache
{
    private $path;

    private $prefix = '';

    /**
     * if no opcode caches is available, we use JSON, since this is then 1.6-1.9 times faster.
     *
     * @var boolean
     */
    private $useJson = false;

    /**
     * {@inheritdoc}
     */
    public function setup($config)
    {
        if (!isset($config['path'])) {
            $config['path'] = $this->cacheConfig->getJarves()->getCacheDir() . '/object-cache/';
        }

        $this->path = $config['path'];

        if ($this->hasOpcodeCacher()) {
            //we've no opcode cacher, so use JSON, because it's faster
            $this->useJson = true;
        }

        if (substr($this->path, -1) != '/') {
            $this->path .= '/';
        }

        if (isset($config['prefix'])) {
            $this->prefix = $config['prefix'];
        }
    }

    /**
     * @return bool
     */
    protected function hasOpcodeCacher()
    {
        return function_exists('opcache_compile_file') || function_exists('apc_store') || function_exists('xcache_set');
    }

    /**
     * {@inheritdoc}
     */
    public function testConfig($config)
    {
        if (!isset($config['path'])) {
            $config['path'] = $this->cacheConfig->getJarves()->getCacheDir() . '/object-cache/';
        }

        if (!file_exists($config['path']) && !mkdir($config['path'])) {
            throw new \Exception('Can not create cache folder: ' . $config['path']);
        }

        return true;
    }

    public function setPrefix($prefix)
    {
        $this->prefix = $prefix;
    }

    public function getPath($key)
    {
        return $this->path . $this->prefix . '/'. md5($key) . ($this->useJson ? '.json' : '.php');
    }

    /**
     * {@inheritdoc}
     */
    protected function doGet($key)
    {
        $path = $this->getPath($key);

        if (!file_exists($path)) {
            return false;
        }

        $h = fopen($path, 'r');

        $maxTries = 400; //wait max. 2 seconds, otherwise force it
        $tries = 0;
        while (!flock($h, LOCK_SH) and $tries <= $maxTries) {
            usleep(1000 * 5); //5ms
            $tries++;
        }

        if ($this->useJson) {
            $value = '';
            while (!feof($h)) {
                $value .= fread($h, 8192);
            }
        } else {
            $value = include($path);
        }

        flock($h, LOCK_UN);
        fclose($h);

        if ($this->useJson) {
            return json_decode($value, true);
        } else {
            return $value;
        }
    }

    /**
     * {@inheritdoc}
     */
    protected function doSet($key, $value, $timeout = 0)
    {
        $path = $this->getPath($key);
        if (!is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        if ($this->useJson) {
            $value = json_encode($value);
        } else {
            $value = '<' . "?php \nreturn " . var_export($value, true) . ";\n";
        }

        $h = fopen($path, 'w');

        if (!$h) {
            return false;
        }

        $maxTries = 400; //wait max. 2 seconds, otherwise force it
        $tries = 0;
        while (!flock($h, LOCK_EX) and $tries <= $maxTries) {
            usleep(1000 * 5); //5ms
            $tries++;
        }

        fwrite($h, $value);
        flock($h, LOCK_UN);
        fclose($h);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($key)
    {
        $path = $this->getPath($key);

        return @unlink($path);
    }

}
