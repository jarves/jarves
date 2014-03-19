<?php

namespace Jarves\Filesystem;

use Jarves\Jarves;
use Jarves\File\FileInfo;
use Jarves\Filesystem\Adapter\AdapterInterface;
use Propel\Runtime\Propel;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
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
     * @param Jarves $jarves
     */
    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }



    /**
     * @param string $path
     * @return AdapterInterface
     */
    public function getAdapter($path = null)
    {
        $adapterClass = '\Jarves\Filesystem\Adapter\Local';

        $params['root'] = realpath($this->getJarves()->getKernel()->getRootDir() . '/../web/');

        if ($path && '/' !== $path[0]) {
            $path = '/' . $path;
        }

        if ($path != '/') {
            $sPos = strpos(substr($path, 1), '/');
            if (false === $sPos) {
                $firstFolder = substr($path, 1);
            } else {
                $firstFolder = substr($path, 1, $sPos);
            }
        } else {
            $firstFolder = '/';
        }

        if ('/' !== $firstFolder) {
            //todo
            $mounts = $this->getJarves()->getSystemConfig()->getMountPoints(true);

            //if firstFolder a mounted folder?
            if ($mounts && $mounts->hasMount($firstFolder)) {
//                $mountPoint = $mounts->getMount($firstFolder);
//                $adapterClass = $mountPoint->getClass();
//                $params = $mountPoint->getParams();
//                $mountName = $firstFolder;
            } else {
                $firstFolder = '/';
            }
        }

        if (isset($this->adapterInstances[$firstFolder])) {
            return $this->adapterInstances[$firstFolder];
        }

        $adapter = $this->newAdapter($adapterClass, $firstFolder, $params);
        $adapter->setMountPath($firstFolder);

        if ($adapter instanceof ContainerAwareInterface) {
            $adapter->setContainer($this->getJarves()->getKernel()->getContainer());
        }

        $adapter->loadConfig();

        return $this->adapterInstances[$firstFolder] = $adapter;
    }

    /**
     * @param string $class
     * @param string $mountPath
     * @param array $params
     * @return \Jarves\Filesystem\Adapter\AdapterInterface
     */
    public function newAdapter($class, $mountPath, $params)
    {
        return new $class($mountPath, $params);
    }

    /**
     * @param string $path
     * @return \Jarves\Model\File[]
     */
    public function getFiles($path)
    {
        $items = parent::getFiles($path);
        $fs = $this->getAdapter($path);

        if ($fs->getMountPath()) {
            foreach ($items as &$file) {
                $file->setMountPoint($fs->getMountPath());
            }
        }

        if ('/' === $path) {
            foreach ($this->getJarves()->getSystemConfig()->getMountPoints() as $mountPoint) {
                $fileInfo = new FileInfo();
                $fileInfo->setPath('/' . $mountPoint->getPath());
                $fileInfo->setIcon($mountPoint->getIcon());
                $fileInfo->setType(FileInfo::DIR);
                $fileInfo->setMountPoint(true);
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

        //page bases caching here
        $sql = 'SELECT path
        FROM ' . $this->getJarves()->getSystemConfig()->getDatabase()->getPrefix() . 'system_file
        WHERE id = ' . ($id + 0);
        $con = Propel::getReadConnection('default');
        $stmt = $con->prepare($sql);

        $stmt->execute();

        return $stmt->fetchColumn();

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
                    if ('/' === $oldFs->getMountPath()) {
                        //just directly upload the stuff
                        $this->copyFolder($oldFs->getAdapter()->getRoot() . $oldFile, $newPath);
                    } else {
                        //we need to copy all files down to our local hdd temporarily
                        //and upload then
                        $folder = $this->downloadFolder($oldFile);
                        $this->copyFolder($folder, $newPath);
                        $this->getJarves()->getCacheFileSystem()->delete($folder);
                    }
                }
                if ('move' === $action) {
                    $oldFs->delete($this->normalizePath($oldFile));
                    if ($this) {
                        $file->setPath($this->normalizePath($newPath));
                        $file = $this->wrap($file);
                        $file->save();
                    }
                }
                $result = true;
            }
            if ('move' === $action) {
                $file = $this->wrap($file);
                $file->setPath($this->normalizePath($newPath));
                $file->save();
            }
        }

        return $result;
    }

    public function downloadFolder($path, $to = null)
    {
        $fs = $this->getAdapter($path);
        $files = $fs->getFiles($this->normalizePath($path));

        $to = $to ? : $this->getJarves()->getUtils()->createTempFolder('', false);
        $tempFs = $this->getJarves()->getCacheFileSystem();

        if (is_array($files)) {
            foreach ($files as $file) {
                if ('file' === $file['type']) {
                    $content = $fs->read($this->normalizePath($path . '/' . $file['name']));
                    $tempFs->write($to . '/' . $file['name'], $content);
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