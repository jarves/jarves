<?php

namespace Jarves\Filesystem;

use Jarves\File\FileInfo;
use Jarves\Filesystem\Adapter\AdapterInterface;
use Jarves\Model\File;
use Jarves\File\FileInfoInterface;
use Jarves\Model\FileQuery;
use Propel\Runtime\ActiveQuery\Criteria;
use Propel\Runtime\Map\TableMap;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;

class Filesystem implements FilesystemInterface
{

    /**
     * @var AdapterInterface
     */
    protected $adapter;

    /**
     * @param string|null $path
     *
     * @return AdapterInterface
     */
    public function getAdapter($path = null)
    {
        return $this->adapter;
    }

    /**
     * @param AdapterInterface $adapter
     */
    public function setAdapter(AdapterInterface $adapter)
    {
        $this->adapter = $adapter;
        $this->adapter->loadConfig();
    }

    /**
     * Removes the name of the mount point from the proper layer.
     * Also removes '..' and replaces '//' => '/'
     *
     * This is needed because the file layer gets the relative path under his own root.
     * Forces a / at the beginning, removes the trailing / if exists.
     *
     * @param  string|array $path
     *
     * @return string
     */
    public function normalizePath($path)
    {
        if (is_array($path)) {
            $result = [];
            foreach ($path as $p) {
                $result[] = $this->normalizePath($p);
            }

            return $result;
        } else {
            if ('/' !== $path[0]) {
                $path = '/' . $path;
            }

            if ('/' === substr($path, -1)) {
                $path = substr($path, 0, -1);
            }

            $fs = $this->getAdapter($path);
            $path = substr($path, strlen($fs->getMountPath()));


            if ('/' !== $path[0]) {
                $path = '/' . $path;
            }

            $path = str_replace('..', '', $path);
            $path = str_replace('//', '/', $path);

            return $path;
        }
    }

    /**
     * Return information for a file/folder.
     *
     * The result contains following information:
     *  [path(relative), name, type(dir|file), ctime(unixtimestamp), mtime(unixtimestamp), size(bytes)]
     *
     *  array(
     *    path => path to this file/folder for usage in the administration and modules. Not the full http path. No trailing slash!
     *    name => basename(path)
     *    ctime => as unix timestamps
     *    mtime => as unix timestamps
     *    size => filesize in bytes (not for folders)
     *    type => 'dir' or 'file'
     *  )
     *
     * @static
     *
     * @param string $path
     *
     * @return FileInfoInterface
     */
    public function getFile($path)
    {
        $fs = $this->getAdapter($path);
        $path = $this->normalizePath($path);

        return $fs->getFile($path);
    }

    public function checkFileValues(FileInfo $file, File $databaseFile)
    {
        if ($file->getSize() != $databaseFile->getSize()) {
            $databaseFile->setSize($file->getSize());
        }
        if ($file->getHash() != $databaseFile->getHash()) {
            $databaseFile->setHash($file->getHash());
        }
        if ($file->getType() != $databaseFile->getType()) {
            $databaseFile->setType($file->getType());
        }
        if ($file->getCreatedTime() != $databaseFile->getCreatedTime()) {
            $databaseFile->setCreatedTime($file->getCreatedTime());
        }
        if ($file->getModifiedTime() != $databaseFile->getModifiedTime()) {
            $databaseFile->setModifiedTime($file->getModifiedTime());
        }
    }

    public function createFromPathInfo(FileInfoInterface $fileInfo)
    {
        $array = $fileInfo->toArray();
        $file = new File();
        $file->fromArray($array, TableMap::TYPE_CAMELNAME);
        $file->setHash($this->hash($file->getPath()));
        $file->save();

        return $file;
    }

    /**
     * @return array
     */
    public function search($path, $q, $depth)
    {
        //todo
        return [];
    }

    /**
     * @param string $path
     * @param string $content
     * @return boolean
     */
    public function write($path, $content = '')
    {
        $fs = $this->getAdapter($path);

        return $fs->write($this->normalizePath($path), $content);
    }

    /**
     * Returns the file count inside $folderPath
     *
     * @static
     *
     * @param  string $folderPath
     *
     * @return mixed
     */
    public function getCount($folderPath)
    {
        $fs = $this->getAdapter($folderPath);

        return $fs->getCount(static::normalizePath($folderPath));
    }

    /**
     * @param string $path
     * @return string
     */
    public function read($path)
    {
        $fs = $this->getAdapter($path);

        return $fs->read($this->normalizePath($path));
    }

    /**
     * @param string $path
     * @return boolean
     */
    public function has($path)
    {
        $fs = $this->getAdapter($path);

        return $fs->has($this->normalizePath($path));
    }

    /**
     * @param string $path
     * @return boolean
     */
    public function remove($path)
    {
        return $this->delete($path);
    }

    /**
     * @param string $path
     * @return boolean
     */
    public function delete($path)
    {
        $fs = $this->getAdapter($path);

        return $fs->delete($this->normalizePath($path));
    }

    public function hash($path)
    {
        $fs = $this->getAdapter($path);
        return $fs->hash($this->normalizePath($path));
    }

    public function mkdir($path)
    {
        $fs = $this->getAdapter($path);
        return $fs->mkdir($this->normalizePath($path));
    }

    public function rename($source, $target)
    {
        return $this->move($source, $target);
    }

    public function move($source, $target)
    {
        $fs = $this->getAdapter($source);
        return $fs->move($this->normalizePath($source), $this->normalizePath($target));
    }

    public function copy($source, $target)
    {
        $fs = $this->getAdapter($source);
        return $fs->copy($this->normalizePath($source), $this->normalizePath($target));
    }

    /**
     * List directory contents.
     *
     * Same as in getFile() but in a list.
     *
     *  array(
     *    array(
     *      path => path to the file/folder for usage in the administration and modules. Not the full http path. No trailing slash!
     *      name => basename(path)
     *      ctime => as unix timestamps
     *      mtime => as unix timestamps
     *      size => filesize in bytes (not for folders)
     *      type => 'file' | 'dir'
     *      mount => boolean (if the folder is a mount point)
     *    )
     *  )
     *
     * @static
     *
     * @param string $path
     *
     * @return File[]
     */
    public function getFiles($path)
    {
        //$access = jarvesAcl::check(3, $path, 'read', true);
        //if (!$access) return false;
        $fs = $this->getAdapter($path);
        $path = $this->normalizePath($path);

        if ($path == '/trash') {
            #return $this->getTrashFiles();
        }

        $items = $fs->getFiles($path);
        if (!is_array($items)) {
            return $items;
        }

        if (count($items) == 0) {
            return array();
        }

        usort(
            $items,

            /**
             * @param FileInfoInterface $a
             * @param FileInfoInterface $b
             *
             * @return mixed
             */
            function($a, $b){
                return strnatcasecmp($a ? $a->getPath() : '', $b ? $b->getPath() : '');
            });

        return $items;
    }


    /**
     * Resize a image and returns it's object.
     *
     * @param string  $path
     * @param integer $width
     * @param int     $height
     *
     * @return \PHPImageWorkshop\ImageWorkshop
     */
    public function getResizeMax($path, $width, $height)
    {
        $content = $this->read($path);
        if (!$content) {
            return null;
        }

        $image = \PHPImageWorkshop\ImageWorkshop::initFromString($content);

        $widthOriginal = $image->getWidth();
        $heightOriginal = $image->getHeight();

        if ($width > $widthOriginal && $height > $heightOriginal) {
            return $image;
        }

        $newWidth = null;
        $newHeight = null;

        if ($widthOriginal > $heightOriginal) {
            $newWidth = $width;
        } else {
            $newHeight = $height;
        }

        $image->resizeInPixel($newWidth, $newHeight, true);

        if ($image->getHeight() > $height) {
            $image->resizeInPixel(null, $height, true);
        }
        if ($image->getWidth() > $width) {
            $image->resizeInPixel($width, null, true);
        }

        return $image;
    }

    /**
     *
     *
     * @param string $path
     * @param string $resolution <width>x<height>
     * @param bool   $resize
     *
     * @return resource
     */
    public function getThumbnail($path, $resolution, $resize = false)
    {
        $content = $this->read($path);
        $image = imagecreatefromstring($content);

        list($newWidth, $newHeight) = explode('x', $resolution);
        $thumbWidth = $newWidth;
        $thumbHeight = $newHeight;

        $oriWidth = imagesx($image);
        $oriHeight = imagesy($image);
        $thumbImage = imagecreatetruecolor($thumbWidth, $thumbHeight);
        imagealphablending($thumbImage, false);

        imagealphablending($image, false);
        imagesavealpha($image, true);

        if (!$resize && $thumbWidth >= $oriWidth && $thumbHeight > $oriHeight) {
            return $image;
        }

        if ($oriWidth > $oriHeight) {

            $ratio = $thumbHeight / ($oriHeight / 100);
            $_width = ceil($oriWidth * $ratio / 100);

//            $top = 0;
            if ($_width < $thumbWidth) {
//                $ratio = $_width / ($thumbWidth / 100);
//                $nHeight = $thumbHeight * $ratio / 100;
//                $top = ($thumbHeight - $nHeight) / 2;
                $_width = $thumbWidth;
            }

            $tempImg = imagecreatetruecolor($_width, $thumbHeight);
            imagealphablending($tempImg, false);
            imagecopyresampled($tempImg, $image, 0, 0, 0, 0, $_width, $thumbHeight, $oriWidth, $oriHeight);
            $_left = ($_width / 2) - ($thumbWidth / 2);

            imagecopyresampled(
                $thumbImage,
                $tempImg,
                0,
                0,
                $_left,
                0,
                $thumbWidth,
                $thumbHeight,
                $thumbWidth,
                $thumbHeight
            );

        } else {
            $ratio = $thumbWidth / ($oriWidth / 100);
            $_height = ceil($oriHeight * $ratio / 100);
            $tempImg = imagecreatetruecolor($thumbWidth, $_height);
            imagealphablending($tempImg, false);
            imagecopyresampled($tempImg, $image, 0, 0, 0, 0, $thumbWidth, $_height, $oriWidth, $oriHeight);
            $_top = ($_height / 2) - ($thumbHeight / 2);
            imagecopyresampled(
                $thumbImage,
                $tempImg,
                0,
                0,
                0,
                $_top,
                $thumbWidth,
                $thumbHeight,
                $thumbWidth,
                $thumbHeight
            );
        }

        imagealphablending($thumbImage, false);
        imagesavealpha($thumbImage, true);

        return $thumbImage;

    }
}