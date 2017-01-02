<?php

namespace Jarves\Filesystem;

use Jarves\Filesystem\Adapter\Local;
use Jarves\Jarves;
use Jarves\File\FileInfo;
use Jarves\Filesystem\Adapter\AdapterInterface;
use Jarves\JarvesConfig;
use Jarves\Model\File;
use Jarves\Model\FileQuery;
use Jarves\Utils;
use Propel\Runtime\ActiveQuery\Criteria;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Finder\Finder;

class WebFilesystem extends Filesystem
{

    /**
     * @var array
     */
    protected $adapterInstances = [];

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var JarvesConfig
     */
    private $jarvesConfig;

    /**
     * @var ContainerInterface
     */
    private $container;

    /**
     * @var Filesystem
     */
    private $cacheFilesystem;
    /**
     * @var Utils
     */
    private $utils;

    private $mountNames = [];

    /**
     * @param Jarves $jarves
     * @param JarvesConfig $jarvesConfig
     * @param ContainerInterface $container
     * @param Filesystem $cacheFilesystem
     */
    function __construct(
        Jarves $jarves,
        JarvesConfig $jarvesConfig,
        ContainerInterface $container,
        Filesystem $cacheFilesystem
    )
    {
        $this->jarves = $jarves;
        $this->jarvesConfig = $jarvesConfig;
        $this->container = $container;
        $this->cacheFilesystem = $cacheFilesystem;
    }

    /**
     * @param array $mountNames
     */
    public function setMountNames(array $mountNames)
    {
        $this->mountNames = $mountNames;
    }

    /**
     * Creates a temp folder and returns its path.
     * Please use TempFile::createFolder() class instead.
     *
     * @param  string $prefix
     * @param  bool $fullPath Returns the full path on true and the relative to the current TempFolder on false.
     *
     * @return string Path with trailing slash
     */
    public function createTempFolder($prefix = '', $fullPath = true)
    {
        $tmp = $this->jarves->getCacheDir();

        do {
            $path = $tmp . $prefix . dechex(time() / mt_rand(100, 500));
        } while (is_dir($path));

        mkdir($path);

        if ('/' !== substr($path, -1)) {
            $path .= '/';
        }

        return $fullPath ? $path : substr($path, strlen($tmp));
    }

    public function getMountDirectory($path)
    {
        $path = trim($path, '//');
        $folders = explode('/', $path);
        $firstFolder = array_shift($folders) ?: '/';

        if ('/' !== $firstFolder && in_array($firstFolder, $this->mountNames, true)) {
            return $firstFolder;
        }

        return '';
    }

    /**
     * @param string $path
     *
     * @return AdapterInterface
     */
    public function getAdapter($path = null)
    {
        $adapterServiceId = 'jarves.filesystem.adapter.local';

        $params['root'] = realpath($this->jarves->getRootDir() . '/../web/');
        $mountDirectory = $this->getMountDirectory($path) ?: '/';

        if ('/' !== $mountDirectory) {
            $adapterServiceId = 'jarves.filesystem.mount.' . $mountDirectory;
        }

        if (isset($this->adapterInstances[$mountDirectory])) {
            return $this->adapterInstances[$mountDirectory];
        }

        /** @var AdapterInterface $adapter */
        $adapter = $this->container->get($adapterServiceId);

        if ($adapter instanceof ContainerAwareInterface) {
            $adapter->setContainer($this->container);
        }

        return $this->adapterInstances[$mountDirectory] = $adapter;
    }

    /**
     * {@inheritdoc}
     *
     * @return FileInfo
     */
    public function getFile($path)
    {
        if ('/' === $path) {
            $fileInfo = new FileInfo();
            $fileInfo->setPath('/');
            $fileInfo->setType('dir');
            return $fileInfo;
        }

        $normalized = trim($path, "\\//\r\n");
        if (in_array($normalized, $this->mountNames, true)) {
            $fileInfo = new FileInfo();
            $fileInfo->setPath('/' . $normalized . '/');
            $fileInfo->setType('dir');
            $fileInfo->setMountPoint(true);
            $fs = $this->getAdapter('/' . $normalized);
            $fileInfo->setPublicUrl($fs->publicUrl(''));
            return $fileInfo;
        }

        $files = parent::getFile($path);
        $this->syncDatabase($files);

        return $files;
    }

    /**
     * Returns a File object. If the file behind the file's 'path'
     * does not exists in the database, it will be created.
     *
     * This maintains the file references. Jarves does not store the actual path
     * in references but an ID. This ID is related to the path. If a file path is changed
     * we need only to change one place (system_file table) instead of all references.
     *
     * @param FileInfo|FileInfo[] $fileInfo
     *
     * @return File[]|File
     */
    public function syncDatabase($fileInfo)
    {
        if (null === $fileInfo) {
            return null;
        }

        if (is_array($fileInfo)) {
            $result = [];
            $paths = [];
            foreach ($fileInfo as $file) {
                if ($file instanceof File) {
                    return $fileInfo; //it's already a `File` array, return it.
                }
                $paths[] = $file->getPath();
            }

            $files = FileQuery::create()
                ->orderById(Criteria::ASC)
                ->filterByPath($paths)
                ->groupByPath()
                ->find()
                ->toKeyIndex('path');

            foreach ($fileInfo as $file) {
                if (isset($files[$file->getPath()])) {
                    $this->updateDatabaseFile($file, $files[$file->getPath()]);
                    $result[] = $files[$file->getPath()];
                } else {
                    $result[] = $this->createFromPathInfo($file);
                }
            }

            return $result;
        } else {
            $path = $fileInfo->getPath();

            $databaseFile = FileQuery::create()->orderById()->filterByPath($path)->groupByPath()->findOne();
            if (!$databaseFile) {
                $databaseFile = $this->createFromPathInfo($fileInfo);
            } else {
                $this->updateDatabaseFile($fileInfo, $databaseFile);
            }

            return $databaseFile;
        }
    }

    /**
     * @param string $path
     * @return FileInfo[]
     */
    public function getFiles($path)
    {
        $items = parent::getFiles($path);

        foreach ($items as &$file) {
            $file->setMountPoint($this->getMountDirectory($path));
        }

        $this->syncDatabase($items);

        if ('/' === $path) {
            foreach ($this->mountNames as $name) {
                $fileInfo = new FileInfo();
                $fileInfo->setPath('/' . $name . '/');
                $fileInfo->setType(FileInfo::DIR);
                $fileInfo->setMountPoint(true);
                $fs = $this->getAdapter('/' . $name);
                $fileInfo->setPublicUrl($fs->publicUrl(''));
                array_unshift($items, $fileInfo);
            }
        }

        return $items;
    }


    /**
     * Translates the internal id to the real path.
     * Example: getPath(45) => '/myImageFolder/Picture1.png'
     *
     * @static
     *
     * @param  integer|string $id String for backward compatibility
     *
     * @return string
     */
    public function getPath($id)
    {
        if (!is_numeric($id)) {
            return $id;
        }

        return FileQuery::create()->select('path')->findOneById($id);
    }

    public function move($source, $target)
    {
        return $this->paste($source, $target, 'move');
    }

    public function copy($source, $target)
    {
        return $this->paste($source, $target, 'copy');
    }

    /**
     * Copies or moves files to a destination.
     * If the source is a folder, it copies recursively.
     *
     * @static
     *
     * @param  array|string $source
     * @param  string       $target
     * @param  string       $action move|copy
     *
     * @return bool
     */
    public function paste($source, $target, $action = 'move')
    {
        $files = (array)$source;
        $action = strtolower($action);

        $result = false;
        foreach ($files as $file) {
            $oldFile = str_replace('..', '', $file);
            $oldFile = str_replace(chr(0), '', $oldFile);

            $oldFs = $this->getAdapter($oldFile);
            //if the $target is a folder with trailing slash, we move/copy the files _into_ it otherwise we replace.
            $newPath = '/' === substr($target, -1) ? $target . basename($file) : $target;

            $newFs = $this->getAdapter($newPath);

            $file = null;
            if ($newFs === $oldFs) {
                $file = $this->getFile($oldFile);
                $result = $newFs->$action($this->normalizePath($oldFile), $this->normalizePath($newPath));
            } else {
                //we need to move a folder from one file layer to another.
                $file = $oldFs->getFile($this->normalizePath($oldFile));

                if ($file->getType() == 'file') {
                    $content = $oldFs->read($this->normalizePath($oldFile));
                    $newFs->write($this->normalizePath($newPath), $content);
                } else {
                    if ($oldFs instanceof Local) {
                        /** @var Local $oldFs */
                        //just directly upload the stuff
                        $this->copyFolder($oldFs->getRoot() . $oldFile, $newPath);
                    } else {
                        //we need to copy all files down to our local hdd temporarily
                        //and upload then
                        $folder = $this->downloadFolder($oldFile);
                        $this->copyFolder($folder, $newPath);
                        $this->cacheFilesystem->delete($folder);
                    }
                }
                if ('move' === $action) {
                    $oldFs->delete($this->normalizePath($oldFile));
                    if ($this) {
                        $file->setPath($this->normalizePath($newPath));
                        $this->syncDatabase($file);
                    }
                }
                $result = true;
            }
            if ('move' === $action) {
                $databaseFile = $this->syncDatabase($file);
                $databaseFile->setPath($this->normalizePath($newPath));
                $databaseFile->save();
            }
        }

        return $result;
    }

    public function downloadFolder($path, $to = null)
    {
        $fs = $this->getAdapter($path);
        $files = $fs->getFiles($this->normalizePath($path));

        $to = $to ? : $this->createTempFolder('', false);

        if (is_array($files)) {
            foreach ($files as $file) {
                if ('file' === $file['type']) {
                    $content = $fs->read($this->normalizePath($path . '/' . $file['name']));
                    $this->cacheFilesystem->write($to . '/' . $file['name'], $content);
                } else {
                   $this->downloadFolder($path . '/' . $file['name'], $to . '/' . $file['name']);
                }
            }
        }

        return $to;
    }

    public function copyFolder($from, $to)
    {
        $fs = $this->getAdapter($to);
        $fs->mkdir($this->normalizePath($to));

        $normalizedPath = $this->normalizePath($to);

        $files = Finder::create()
            ->in($from);

        $result = true;

        foreach ($files as $file) {
            $newName = $normalizedPath . '/' . substr($file, strlen($from) + 1);

            if (is_dir($file)) {
                $result &= $fs->mkdir($this->normalizePath($newName));
            } else {
                $result &= $fs->write($this->normalizePath($newName), file_get_contents($file));
            }
        }

        return $result;
    }
}
