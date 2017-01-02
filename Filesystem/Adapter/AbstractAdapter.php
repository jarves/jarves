<?php

namespace Jarves\Filesystem\Adapter;

use Jarves\Jarves;
use Symfony\Component\DependencyInjection\ContainerAware;

/**
 * Abstract class for the FAL (File abstraction layer).
 *
 * Please note: All methods $path arguments are relative to your mountPath!
 *
 */
abstract class AbstractAdapter implements AdapterInterface
{
    /**
     * Returns the content hash (max 64 byte).
     *
     * @param $path
     *
     * @return string
     */
    public function hash($path)
    {
        return md5($this->read($path));
    }
}
