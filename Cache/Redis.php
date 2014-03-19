<?php

namespace Jarves\Cache;

class Redis extends AbstractCache
{
    private $connection;

    /**
     * {@inheritdoc}
     */
    public function setup($config)
    {
        $this->connection = new \Redis();

        foreach ($config['servers'] as $server) {
            $this->connection->connect($server['ip'], $server['port'] + 0);
        }

        $this->connection->setOption(\Redis::OPT_SERIALIZER, \Redis::SERIALIZER_IGBINARY);

    }

    /**
     * {@inheritdoc}
     */
    public function testConfig($config)
    {
        if (!@$config['servers']) {
            throw new \Exception('No redis servers set.');
        }

        if (!class_exists('\Redis')) {
            throw new \Exception('The module Redis is not activated in your PHP environment.');
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doGet($key)
    {
        return $this->connection->get($key);
    }

    /**
     * {@inheritdoc}
     */
    protected function doSet($key, $value, $timeout = null)
    {
        return $this->connection->setex($key, $timeout, $value);
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($key)
    {
        $this->connection->delete($key);
    }
}
