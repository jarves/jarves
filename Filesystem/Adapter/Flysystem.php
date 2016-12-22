<?php

namespace Jarves\Filesystem\Adapter;

use Jarves\Exceptions\FileNotFoundException;
use Jarves\File\FileInfo;
use League\Flysystem\Filesystem;
use League\Flysystem\Sftp\SftpAdapter;

/**
 * Adpater for the flysystem.
 *
 */
class Flysystem extends AbstractAdapter
{
    /**
     * @var Filesystem
     */
    private $filesystem;

    /**
     * @var
     */
    private $name;

    /**
     * @var
     */
    private $baseUrl;

    private $REQUIRED;

    public function __construct()
    {
        $this->REQUIRED = new \stdClass;
    }

    protected function getOptions($name, $options, $defaults)
    {
        foreach ($defaults as $key => $value) {
            if (!isset($options[$key])) {
                if ($this->REQUIRED === $value) {
                    throw new \Exception("The mount '$name' needs an option '$key' defined.");
                }
                $options[$key] = $value;
            }
        }

        return $options;
    }

    public function initialize($name, $type, $baseUrl, array $options)
    {
        $adapter = null;

        switch ($type){
            case 'sftp':
                $options = $this->getOptions($name, $options, [
                    'host' => $this->REQUIRED,
                    'port' => 21,
                    'username' => posix_getpwuid(posix_geteuid())['name'],
                    'password' => '',
                    'root' => $this->REQUIRED,
                    'privateKey' => '',
                    'timeout' => 10
                ]);

                $adapter = new SftpAdapter($options);
                break;
        }

        if (!$adapter) {
            throw new \Exception("Type '$type' not compatible with flysytem");
        }

        $this->filesystem = new \League\Flysystem\Filesystem($adapter);

        $this->name = $name;
        $this->baseUrl = $baseUrl;
    }

    public function write($path, $content = '')
    {
        if ($this->filesystem->has($path)) {
            return $this->filesystem->update($path, $content);
        }

        return $this->filesystem->write($path, $content);
    }

    public function publicUrl($path)
    {
        return rtrim($this->baseUrl, '/') . '/' . trim($path, "\\//");
    }

    public function size($path)
    {
        return $this->filesystem->getSize($path);
    }

    public function read($path)
    {
        return $this->filesystem->read($path);
    }

    public function has($path)
    {
        return $this->filesystem->has($path);
    }

    public function delete($path)
    {
        return $this->filesystem->delete($path);
    }

    public function mkdir($path)
    {
        return $this->filesystem->createDir($path);
    }

    public function filemtime($path)
    {
        return $this->filesystem->getTimestamp($path);
    }

    public function move($source, $target)
    {
        $this->filesystem->rename($source, $target);
    }

    public function copy($path, $newPath)
    {
        $this->filesystem->copy($path, $newPath);
    }

    public function getFiles($path)
    {
        $items = [];
        $contents = $this->filesystem->listContents($path);
        foreach ($contents as $content) {

            $file = new \Jarves\File\FileInfo();
            $file->setPath('/' . $this->name . '/' . $content['path']);
            $file->setType($content['type']);
            $file->setCreatedTime($content['timestamp']);
            $file->setModifiedTime($content['timestamp']);
            $file->setPublicUrl($this->publicUrl($content['path']));

            if (isset($content['size'])) {
                $file->setSize($content['size']);
            }

            $items[] = $file;
        }

        return $items;
    }

    /**
     * @param string $path
     *
     * @return integer
     */
    public function getCount($path)
    {
        return count($this->filesystem->listContents($path));
    }

    /**
     * @param string $path
     *
     * @return FileInfo
     * @throws FileNotFoundException
     */
    public function getFile($path)
    {
        $metaData = $this->filesystem->getMetadata($path);
        if (!$metaData) {
            throw new FileNotFoundException(sprintf('File `%s` does not exists.', $path));
        }

        $file = new \Jarves\File\FileInfo();
        $file->setPath('/' . $this->name . '/' . $path);
        $file->setType($metaData['type']);
        $file->setPublicUrl($this->publicUrl($path));

        $size = $this->filesystem->getSize($path);
        $timestamp = $this->filesystem->getTimestamp($path);

        $file->setCreatedTime($timestamp);
        $file->setModifiedTime($timestamp);
        $file->setSize($size);

        return $file;
    }
}
