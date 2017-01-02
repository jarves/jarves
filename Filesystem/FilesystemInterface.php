<?php

namespace Jarves\Filesystem;

use Jarves\File\FileInfo;
use Jarves\Filesystem\Adapter\AdapterInterface;

interface FilesystemInterface {

    public function write($path, $content = '');
    public function read($path);
    public function has($path);
    public function mkdir($path);
    public function delete($path);
    public function rename($source, $target);
    public function move($source, $target);
    public function copy($source, $target);

    /**
     * @return AdapterInterface
     */
    public function getAdapter();

    /**
     * @param string $path
     * @return FileInfo[]
     */
    public function getFiles($path);

    /**
     * @param string $path
     * @return FileInfo
     */
    public function getFile($path);

    /**
     * @param string $path
     * @return integer
     */
    public function getCount($path);

}