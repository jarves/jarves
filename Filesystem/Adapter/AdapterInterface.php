<?php

namespace Jarves\Filesystem\Adapter;

use Jarves\File\FileInfo;

interface AdapterInterface
{
    public function initialize($name, $type, $baseUrl, array $options);

    public function write($path, $content = '');

    public function read($path);

    public function has($path);

    public function delete($path);

    public function mkdir($path);

    public function hash($path);

    public function filemtime($path);

    public function size($path);

    public function move($source, $target);

    public function copy($path, $newPath);

    /**
     * Returns the public urls
     *
     * @param string $path
     *
     * @return string
     */
    public function publicUrl($path);

    /**
     * @param string $path
     *
     * @return FileInfo[]
     */
    public function getFiles($path);

    /**
     * @param string $path
     *
     * @return integer
     */
    public function getCount($path);

    /**
     * @param string $path
     *
     * @return FileInfo
     */
    public function getFile($path);
}
