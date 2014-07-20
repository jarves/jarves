<?php

namespace Jarves\Filesystem\Adapter;

use Jarves\Exceptions\FileNotFoundException;
use Jarves\Exceptions\FileNotWritableException;
use Jarves\Exceptions\FileOperationPermittedException;
use Jarves\Exceptions\NotADirectoryException;
use Jarves\File\FileInfo;

/**
 * Local file layer for the local file system.
 *
 */
class Local extends AbstractAdapter
{
    /**
     * Current root folder.
     *
     * @var string
     */
    private $root = 'web/';

    /**
     * Default permission modes for directories.
     *
     * @var integer
     */
    public $dirMode = 0700;

    /**
     * Default permission modes for files.
     *
     * @var integer
     */
    public $fileMode = 0600;

    /**
     * Defines whether we chmod the edited file or not.
     *
     * @var bool
     */
    public $changeMode = true;

    /**
     * Default group owner name.
     *
     * @var string
     */
    public $groupName = '';

    /**
     * {@inheritDoc}
     */
    public function __construct($mountPoint, $params = null)
    {
        parent::__construct($mountPoint, $params);
    }

    public function getFullPath($path)
    {
        $root = $this->getRoot();

        if (substr($root, -1) !== '/') {
            $root .= '/';
        }

        if (substr($path, 0, 1) == '/') {
            $path = substr($path, 1);
        }

        return $root . $path;
    }

    public function setParams($params)
    {
        parent::setParams($params);
        if ($this->getParam('root')) {
            $this->setRoot($this->getParam('root'));
        }
    }


    /**
     * Sets file permissions on file/folder recursively.
     *
     * @param  string $path
     *
     * @throws FileOperationPermittedException
     * @return bool
     */
    public function setPermission($path)
    {
        if (!file_exists($path)) {
            return false;
        }

        if ($this->groupName) {
            if (!chgrp($path, $this->groupName)) {
                throw new FileOperationPermittedException(sprintf(
                    'Operation to chgrp the file %s to %s is permitted.',
                    $path,
                    $this->groupName
                ));
            }
        }

        if (is_dir($path)) {

            if (!chmod($path, $this->dirMode)) {
                throw new FileOperationPermittedException(sprintf(
                    'Operation to chmod the folder %s to %o is permitted.',
                    $path,
                    $this->dirMode
                ));
            }

//            $sub = find($path . '/*', false);
//            if (is_array($sub)) {
//                foreach ($sub as $path) {
//                    $this->setPermission(substr($path, 0, strlen($this->getRoot())));
//                }
//            }
        } elseif (is_file($path)) {
            @chmod($path, $this->fileMode);
        }

        return true;

    }

    /**
     * Loads and converts the configuration to appropriate modes.
     *
     */
    public function loadConfig()
    {
        $this->fileMode = 600;
        $this->dirMode = 700;

        if ($this->getJarves()->getSystemConfig()->getFile()->getGroupPermission() == 'rw') {
            $this->fileMode += 60;
            $this->dirMode += 70;
        } elseif ($this->getJarves()->getSystemConfig()->getFile()->getGroupPermission() == 'r') {
            $this->fileMode += 40;
            $this->dirMode += 50;
        }

        if ($this->getJarves()->getSystemConfig()->getFile()->getEveryonePermission() == 'rw') {
            $this->fileMode += 6;
            $this->dirMode += 7;
        } elseif ($this->getJarves()->getSystemConfig()->getFile()->getEveryonePermission() == 'r') {
            $this->fileMode += 4;
            $this->dirMode += 5;
        }

        $this->fileMode = octdec($this->fileMode);
        $this->dirMode = octdec($this->dirMode);
        $this->groupName = $this->getJarves()->getSystemConfig()->getFile()->getGroupOwner();
        $this->changeMode = !$this->getJarves()->getSystemConfig()->getFile()->getDisableModeChange();
    }

    /**
     * Gets current root folder for this local layer.
     *
     * @param string $root
     */
    public function setRoot($root)
    {
        $this->root = realpath($root);
    }

    /**
     * Sets current root folder for this local layer.
     *
     * @return string
     */
    public function getRoot()
    {
        $root = $this->root;
        if ('/' !== substr($root, -1)) {
            $root .= '/';
        }
        return $root;
    }

    /**
     * {@inheritDoc}
     */
    public function createFile($path, $content = null)
    {
        $path2 = $this->getFullPath($path);

        if (!file_exists(dirname($path2))) {
            $this->mkdir(dirname($path));
        }

        if (!file_exists($path2)) {
            if (!is_writable(dirname($path2))) {
                throw new FileNotWritableException(sprintf(
                    'Can not create the file %s in %s, since the folder is not writable.',
                    $path2,
                    dirname($path2)
                ));
            }
            if (null !== $content) {
                file_put_contents($path2, $content);
            } else {
                touch($path2);
            }
            if ($this->changeMode) {
                $this->setPermission($path);
            }
        }

        return file_exists($path2);
    }

    /**
     * @param  string $path The full absolute path
     *
     * @return bool
     * @throws FileOperationPermittedException
     */
    private function _mkdir($path)
    {
        if (!is_dir($path)) {
            if (!@mkdir($path, $this->dirMode, true) ){
                throw new FileOperationPermittedException(sprintf(
                    'mkdir(%s): Permission denied.',
                    $path
                ));
            }
        }

        if ($this->groupName) {
            if (!@chgrp($path, $this->groupName)) {
                throw new FileOperationPermittedException(sprintf(
                    'Operation to chgrp the folder %s to %s is permitted.',
                    $path,
                    $this->groupName
                ));
            }
        }

        if (!chmod($path, $this->dirMode)) {
            throw new FileOperationPermittedException(sprintf(
                'Operation to chmod the folder %s to %o is permitted.',
                $path,
                $this->dirMode
            ));
        }

        return is_dir($path);
    }

    /**
     * {@inheritDoc}
     */
    public function mkdir($path)
    {
        if (!file_exists($path = $this->getFullPath($path))) {
            return $this->_mkdir($path);
        }

        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function write($path, $content = '')
    {
        $oriPath = $path;
        $path = $this->getFullPath($path);

        $fileCreated = false;

        if (!is_dir(dirname($path))) {
            $this->mkdir(dirname($oriPath));
        }

        if (file_exists($path) && !is_writable($path)) {
            throw new FileNotWritableException(sprintf('File %s is not writable.', $path));
        }

        $res = file_put_contents($path, $content);

        if (!$fileCreated && $this->changeMode) {
            $this->setPermission($path);
        }

        return $res === false ? false : true;
    }

    /**
     * {@inheritDoc}
     */
    public function getFiles($path)
    {
        $path = $this->getFullPath($path);
        $path = str_replace('..', '', $path);

        if (!file_exists($path)) {
            throw new FileNotFoundException(sprintf('File `%s` does not exists.', $path));
        }

        if (!is_dir($path)) {
            throw new NotADirectoryException(sprintf('File `%s` is not a directory.', $path));
        };

        if (substr($path, -1) != '/') {
            $path .= '/';
        }

        $h = @opendir($path);
        if (!$h) {
            throw new \Exception(sprintf('Can not open `%s`. Probably no permissions.', $path));
        }

        $items = array();
        while ($file = readdir($h)) {

            $fileInfo = new FileInfo();
            if ($file == '.' || $file == '..') {
                continue;
            }
            $file = $path . $file;

            $fileInfo->setPath(substr($file, strlen($this->getRoot()) - 1));
            $fileInfo->setType(is_dir($file) ? FileInfo::DIR : FileInfo::FILE);

            $fileInfo->setCreatedTime(filectime($file));
            $fileInfo->setModifiedTime(filectime($file));
            $fileInfo->setSize(filesize($file));
            $items[] = $fileInfo;
        }

        return $items;
    }

    /**
     * {@inheritDoc}
     */
    public function getFile($path)
    {
        $file = new \Jarves\File\FileInfo();
        $file->setPath($path ? : '/');
        $path = $this->getFullPath($path ? : '/');
        if (!file_exists($path)) {
            throw new FileNotFoundException(sprintf('File `%s` does not exists.', $path));
        }

        if (!is_readable($path)) {
            throw new FileNotFoundException(sprintf('File `%s` is not readable.', $path));
        }

        $file->setType(is_dir($path) ? 'dir' : 'file');

        $file->setCreatedTime(filectime($path));
        $file->setModifiedTime(filectime($path));
        $file->setSize(filesize($path));

        return $file;
    }

    /**
     * {@inheritDoc}
     */
    public function getSize($path)
    {
        $size = 0;
        $fileCount = 0;
        $folderCount = 0;

        $path2 = $this->getRoot() . $path;

        if ($h = opendir($path2)) {
            while (false !== ($file = readdir($h))) {
                $nextPath = $path2 . '/' . $file;
                if ($file != '.' && $file != '..' && !is_link($nextPath)) {
                    if (is_dir($nextPath)) {
                        $folderCount++;
                        $result = self::getSize($nextPath);
                        $size += $result['size'];
                        $fileCount += $result['fileCount'];
                        $folderCount += $result['folderCount'];
                    } elseif (is_file($nextPath)) {
                        $size += filesize($nextPath);
                        $fileCount++;
                    }
                }
            }
        }
        closedir($h);

        return array(
            'size' => $size,
            'fileCount' => $fileCount,
            'folderCount' => $folderCount
        );
    }

    /**
     * {@inheritDoc}
     */
    public function has($path)
    {
        return file_exists($this->getRoot() . $path);
    }

    /**
     * {@inheritDoc}
     */
    public function getCount($folderPath)
    {
        return count(glob($this->getRoot() . $folderPath . '/*'));
    }

    /**
     * {@inheritDoc}
     */
    public function copy($pathSource, $pathTarget)
    {
        if (!file_exists($this->getRoot() . $pathSource)) {
            return false;
        }
        $this->copyr($this->getRoot() . $pathSource, $this->getRoot() . $pathTarget);

        return file_exists($this->getRoot() . $pathTarget);
    }

    public function copyr($source, $dest, $overwrite = true)
    {
        if (is_file($source)) {
            if ($overwrite || !is_file($dest)) {
                if (!@copy($source, $dest)) {
                    throw new FileNotWritableException(sprintf('Can not copy `%s` to `%s`. Permission denied.', $source, $dest));
                }
            }

            return;
        }

        if (!is_dir($dest)) {
            mkdir($dest, 0777, true);
        } elseif (is_link($source)) {
            $link_dest = readlink($source);

            @symlink($link_dest, $dest);
            return;
        }

        $dir = dir($source);
        if ($dir) {
            while (false !== $entry = $dir->read()) {
                if ($entry == '.' || $entry == '..') {
                    continue;
                }
                if ($dest !== "$source/$entry") {
                    $this->copyr("$source/$entry", "$dest/$entry");
                }
            }
            $dir->close();
        }
    }

    /**
     * {@inheritDoc}
     */
    public function move($pathSource, $pathTarget)
    {
        return rename($this->getRoot() . $pathSource, $this->getRoot() . $pathTarget);
    }

    /**
     * {@inheritDoc}
     */
    public function hash($path)
    {
        if (is_readable($this->getRoot() . $path)) {
            return md5_file($this->getRoot() . $path);
        }

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public function read($path)
    {
        $path = $this->getRoot() . $path;

        if (!file_exists($path)) {
            return null;
        }

        return file_get_contents($path);
    }

    /**
     * {@inheritDoc}
     */
    public function search($path, $pattern, $depth = 1, $currentDepth = 1)
    {
        $result = array();
        $files = $this->getFiles($path);

        $q = str_replace('/', '\/', $pattern);

        foreach ($files as $file) {
            if (preg_match('/^' . $q . '/i', $file->getName(), $match) !== 0) {
                $result[] = $file;
            }
            if ($file->isDir() && ($depth == -1 || $currentDepth < $depth)) {
                $newPath = $path . ($path == '/' ? '' : '/') . $file->getName();
                $more = $this->search($newPath, $pattern, $depth, $currentDepth + 1);
                if (is_array($more)) {
                    $result = array_merge($result, $more);
                }
            }
        }

        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function getPublicUrl($path)
    {
        return '/' . $this->getRoot() . $path;
    }

    /**
     * {@inheritDoc}
     */
    public function delete($path)
    {
        $path2 = $this->getRoot() . $path;

        if (is_dir($path2)) {
            return $this->delDir($path2);
        } elseif (is_file($path2)) {
            if (!@unlink($path2)) {
                throw new FileOperationPermittedException(sprintf(
                    'unlink(%s): Permission denied.',
                    $path2
                ));
            }
            return true;
        }
    }

    public function delDir($dirName)
    {
        if (empty($dirName)) {
            return;
        }
        if (file_exists($dirName)) {
            $dir = dir($dirName);
            $file = '';
            if ($dir) {
                while ($file = $dir->read()) {
                    if ($file != '.' && $file != '..') {
                        if (is_dir($dirName . '/' . $file)) {
                            $this->delDir($dirName . '/' . $file);
                        } else {
                            if (!@unlink($dirName . '/' . $file)){
                                throw new FileOperationPermittedException(sprintf(
                                    'unlink(%s): Permission denied.',
                                    $dirName . '/' . $file
                                ));
                            }
                        }
                    }
                }
            }
            return @rmdir($dirName . '/' . $file);
        } else {
            return true;
        }
    }

    /**
     * {@inheritDoc}
     * @todo
     */
    public function getPublicAccess($path)
    {
        $path2 = $this->getRoot() . $path;

        if (!file_exists($path2)) {
            return false;
        }

        if (!is_dir($path2)) {
            $htaccess = dirname($path2) . '/' . '.htaccess';
        } else {
            $htaccess = $path2 . '/' . '.htaccess';
        }
        $name = basename($path);

        if (@file_exists($htaccess)) {

            $content = $this->getJarves()->fileRead($htaccess);
            @preg_match_all('/<Files ([^>]*)>\W*(\w*) from all[^<]*<\/Files>/smi', $content, $matches, PREG_SET_ORDER);
            if (count($matches) > 0) {
                foreach ($matches as $match) {

                    $match[1] = str_replace('"', '', $match[1]);
                    $match[1] = str_replace('\'', '', $match[1]);

                    //TODO, what is $res?
                    if ($name == $match[1] || (is_dir($match[1]) && $match[1] == "*")) {
                        return strtolower($match[2]) == 'allow' ? true : false;
                    }
                }
            }
        }

        return -1;
    }

    /**
     * {@inheritDoc}
     * @todo
     */
    public function setPublicAccess($path, $access = false)
    {
        $path2 = $this->getRoot() . $path;

        if (!is_dir($path2) == 'file') {
            $htaccess = dirname($path2) . '/' . '.htaccess';
        } else {
            $htaccess = $path2 . '/' . '.htaccess';
        }

        if (!file_exists($htaccess) && !touch($htaccess)) {
            klog('files', t('Can not set the file access, because the system can not create the .htaccess file'));

            return false;
        }

        $content = $this->getJarves()->fileRead($htaccess);

        if (!is_dir($path)) {
            $filename = '"' . basename($path) . '"';
            $filenameesc = preg_quote($filename, '/');
        } else {
            $filename = "*";
            $filenameesc = '\*';
        }

        $content = preg_replace('/<Files ' . $filenameesc . '>\W*(\w*) from all[^<]*<\/Files>/i', '', $content);

        if ($access !== -1) {
            $access2 = $access == true ? 'Allow' : 'Deny';
            $content .= "\n<Files $filename>\n\t$access2 from all\n</Files>";
        }

        $this->getJarves()->fileWrite($htaccess, $content);

        return true;
    }
}
