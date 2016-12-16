<?php

namespace Jarves\Filesystem\Adapter;

use League\Flysystem\AdapterInterface;

/**
 * Adpater for the flysystem.
 *
 */
class Flysystem extends AbstractAdapter
{
    /**
     * @var AdapterInterface
     */
    protected $adapter;

    /**
     * @param AdapterInterface $adapter
     */
    public function __construct(AdapterInterface $adapter)
    {
        $this->adapter = $adapter;
    }
}
