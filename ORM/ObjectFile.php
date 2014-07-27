<?php

namespace Jarves\ORM;

use Jarves\Configuration\Condition;
use Jarves\Exceptions\AccessDeniedException;
use Jarves\Exceptions\FileNotFoundException;
use Jarves\Exceptions\NotADirectoryException;
use Jarves\ORM\Propel;
use Jarves\Tools;

class ObjectFile extends Propel
{

    /**
     */
    public function getNestedSubCondition(Condition $condition)
    {
        return null;
    }

    /**
     * {@inheritDoc}
     *
     * Same as parent method, except:
     * If we get the PK as path we convert it to internal ID.
     */
    public function primaryStringToArray($primaryKey)
    {
        if (is_array($primaryKey)) {
            return $primaryKey;
        }

        if ($primaryKey === '') {
            return false;
        }
        $groups = explode('/', $primaryKey);

        $result = array();

        foreach ($groups as $group) {

            $item = array();
            if ('' === $group) continue;
            $primaryGroups = explode(',', $group);

            foreach ($primaryGroups as $pos => $value) {

                if ($ePos = strpos($value, '=')) {
                    $key = substr($value, 0, $ePos);
                    $value = substr($value, $ePos + 1);
                    if (!in_array($key, $this->primaryKeys)) {
                        continue;
                    }
                } elseif (!$this->primaryKeys[$pos]) {
                    continue;
                }

                if (!is_numeric($value)) {
                    try {
                        $file = $this->getJarves()->getWebFileSystem()->getFile(Tools::urlDecode($value));
                    } catch (FileNotFoundException $e) {
                        $file = null;
                    }
                    if ($file) {
                        $value = $file->getId();
                    } else {
                        continue;
                    }
                }

                $item['id'] = $value;

            }

            if (count($item) > 0) {
                $result[] = $item;
            }
        }

        return $result;
    }

    /**
     * We accept as primary key the path as well, so we have to convert it to internal ID.
     *
     * @param $primaryKey
     */
    public function mapPrimaryKey(&$primaryKey)
    {
        if (!is_numeric($primaryKey['id'])) {
            $file = $this->getJarves()->getWebFileSystem()->getFile(urldecode($primaryKey['id']));
            $primaryKey['id'] = $file['id'];
        }
    }

    /**
     * {@inheritDoc}
     */
    public function remove($primaryKey)
    {
        $this->mapPrimaryKey($primaryKey);

        parent::remove($primaryKey);

        $path = $this->getJarves()->getWebFileSystem()->getPath($primaryKey['id']);

        return $this->getJarves()->getWebFileSystem()->remove($path);
    }

    /**
     * {@inheritDoc}
     */
    public function add($values, $branchPk = false, $mode = 'into', $scope = 0)
    {
        if ($branchPk) {
            $parentPath = is_numeric($branchPk['id']) ? $this->getJarves()->getWebFileSystem()->getPath($branchPk['id']) : $branchPk['id'];
        }

        $path = $parentPath ? $parentPath . $values['name'] : $values['name'];

        $this->getJarves()->getWebFileSystem()->setContent($path, $values['content']);

        return parent::add($values, $branchPk, $mode, $scope);
    }

    /**
     * {@inheritDoc}
     */
    public function update($primaryKey, $values)
    {
        $this->mapPrimaryKey($primaryKey);

        $path = is_numeric($primaryKey['id']) ? $this->getJarves()->getWebFileSystem()->getPath($primaryKey['id']) : $primaryKey['id'];
        $this->getJarves()->getWebFileSystem()->setContent($path, $values['content']);

        return parent::update($primaryKey, $values);
    }

    /**
     * {@inheritDoc}
     */
    public function getItem($primaryKey, $options = null)
    {
        if (is_array($primaryKey)) {
            $path = is_numeric($primaryKey['id']) ? $this->getJarves()->getWebFileSystem()->getPath($primaryKey['id']) : $primaryKey['id'];
        } else {
            $path = $primaryKey ? : '/';
        }

        if (!$path) {
            return null;
        }
        try {
            $item = $this->getJarves()->getWebFileSystem()->getFile($path);
        } catch (FileNotFoundException $e) {
            return null;
        }

        if ($item) {
            return $item->toArray();
        }
    }

    public function getParents($pk, $options = null)
    {
        $path = is_numeric($pk['id']) ? $this->getJarves()->getWebFileSystem()->getPath($pk['id']) : $pk['id'];

        if ('/' === $path) {
            return array();
        }

        $result = array();

        $part = $path;
        while ($part = substr($part, 0, strrpos($part, '/'))) {
            $item = $this->getItem($part);
            $result[] = $item;
        }

        $root = $this->getItem('/');
        $root['_object'] = $this->objectKey;
        $result[] = $root;

        return array_reverse($result);
    }

    /**
     * {@inheritdoc}
     */
    public function getParent($pk, $options = null)
    {
        $path = is_numeric($pk['id']) ? $this->getJarves()->getWebFileSystem()->getPath($pk['id']) : $pk['id'];

        if ('/' === $path) {
            return array();
        }

        $part = $path;
        $part = substr($part, 0, strrpos($part, '/'));
        $item = $this->getItem($part);
        return $item;
    }

    /**
     * {@inheritDoc}
     */
    public function getItems(array $filter = null, Condition $condition = null, $options = null)
    {
        throw new \Exception('getItems not available for this object.');
    }

    public function getParentId($pk)
    {
        if ($pk) {
            $path = is_numeric($pk['id']) ? $this->getJarves()->getWebFileSystem()->getPath($pk['id']) : $pk['id'];
        } else {
            $path = '/';
        }

        if ('/' === $path) return null;

        $lastSlash = strrpos($path, '/');
        $parentPath = substr($path, 0, $lastSlash) ?: '/';
        $file = $this->getJarves()->getWebFileSystem()->getFile($parentPath);

        return [
            'id' => $file->getId()
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function move($pk, $targetPk, $position = 'first', $targetObjectKey = null, $overwrite = false)
    {
        if ($pk) {
            $path = is_numeric($pk['id']) ? $this->getJarves()->getWebFileSystem()->getPath($pk['id']) : $pk['id'];
        } else {
            $path = '/';
        }

        $target = is_numeric($targetPk['id']) ? $this->getJarves()->getWebFileSystem()->getPath($targetPk['id']) : $targetPk['id'];
        $target = $target .'/'. basename($path);

        if (!$overwrite && $this->getJarves()->getWebFileSystem()->exists($target)){
            return ['targetExists' => true];
        }

        $this->checkAccess($path);
        $this->checkAccess($target);

        return $this->getJarves()->getWebFileSystem()->move($path, $target);
    }

    /**
     * Checks the file access.
     *
     * @param $path
     *
     * @throws \FileIOException
     * @throws \AccessDeniedException
     */
    public function checkAccess($path)
    {
        $file = null;

        try {
            $file = $this->getJarves()->getWebFileSystem()->getFile($path);
        } catch (FileNotFoundException $e) {
            while ('/' !== $path) {
                try {
                    $path = dirname($path);
                    $file = $this->getJarves()->getWebFileSystem()->getFile($path);
                } catch (FileNotFoundException $e) {
                }
            }
        }

        if ($file && !$this->getJarves()->getACL()->checkUpdate('Core\\File', array('id' => $file->getId()))) {
            throw new AccessDeniedException(sprintf('No access to file `%s`', $path));
        }
    }

    /**
     * {@inheritDoc}
     */
    public function getBranch($pk = null, Condition $condition = null, $depth = 1, $scope = null, $options = null)
    {
        if ($pk) {
            $path = is_numeric($pk['id']) ? $this->getJarves()->getWebFileSystem()->getPath($pk['id']) : $pk['id'];
        } else {
            $path = '/';
        }

        if ($depth === null) {
            $depth = 1;
        }

        try {
            $files = $this->getJarves()->getWebFileSystem()->getFiles($path);
        } catch (NotADirectoryException $e) {
            return null;
        }

        $c = 0;
//        $offset = $options['offset'];
//        $limit = $options['limit'];
        $result = array();


        $blacklistedFiles = array();
        $showHiddenFiles = false; //todo

        foreach ($files as $file) {
            $file = $file->toArray();

            if (isset($blacklistedFiles[$file['path']]) | (!$showHiddenFiles && substr($file['name'], 0, 1) == '.')) {
                continue;
            }

            if ($condition && $condition->hasRules() && !$condition->satisfy($file, 'jarves/file')) {
                continue;
            }

            $file['writeAccess'] = $this->getJarves()->getACL()->checkUpdate('Core\\File', array('id' => $file['id']));

            $c++;
//            if ($offset && $offset >= $c) {
//                continue;
//            }
//            if ($limit && $limit < $c) {
//                break;
//            }

            if ($depth > 0) {
                $children = array();
                if ($file['type'] == 'dir') {
                    try {
                        $children = self::getBranch(array('id' => $file['path']), $condition, $depth - 1);
                    } catch (FileNotFoundException $e){
                        $children = null;
                    }
                }
                $file['_childrenCount'] = count($children);
                if ($depth > 1 && $file['type'] == 'dir') {
                    $file['_children'] = $children;
                }
            }
            $result[] = $file;
        }

        return $result;
    }
}
