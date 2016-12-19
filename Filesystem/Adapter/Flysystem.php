<?php

namespace Jarves\Filesystem\Adapter;

use Jarves\File\FileInfo;
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


    public function write($path, $content = '')
    {
        // TODO: Implement write() method.
    }

    public function read($path)
    {
        // TODO: Implement read() method.
    }

    public function has($path)
    {
        // TODO: Implement has() method.
    }

    public function delete($path)
    {
        // TODO: Implement delete() method.
    }

    public function mkdir($path)
    {
        // TODO: Implement mkdir() method.
    }

    public function hash($path)
    {
        // TODO: Implement hash() method.
    }

    public function filemtime($path)
    {
        // TODO: Implement filemtime() method.
    }

    public function move($source, $target)
    {
        // TODO: Implement move() method.
    }

    public function copy($path, $newPath)
    {
        // TODO: Implement copy() method.
    }

    public function getFiles($path)
    {
        // TODO: Implement getFiles() method.
    }

    /**
     * @param string $path
     * @return integer
     */
    public function getCount($path)
    {
        // TODO: Implement getCount() method.
    }

    /**
     * @param string $path
     * @return FileInfo
     */
    public function getFile($path)
    {
        // TODO: Implement getFile() method.
    }

    /**
     * {@inheritdoc}
     */
    public function loadConfig()
    {
        // It's not implemented
    }
}
