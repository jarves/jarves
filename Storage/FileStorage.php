<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves\Storage;

use Jarves\ACL;
use Jarves\ConditionOperator;
use Jarves\Configuration\Condition;
use Jarves\Exceptions\AccessDeniedException;
use Jarves\Exceptions\FileNotFoundException;
use Jarves\Exceptions\NotADirectoryException;
use Jarves\Filesystem\WebFilesystem;
use Jarves\Jarves;
use Jarves\Tools;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Finder\SplFileInfo;

class FileStorage extends AbstractStorage
{
    /**
     * @var Jarves
     */
    private $jarves;

    /**
     * @var WebFilesystem
     */
    private $webFilesystem;
    /**
     * @var ACL
     */
    private $acl;
    /**
     * @var ConditionOperator
     */
    private $conditionOperator;

    /**
     * @param Jarves $jarves
     * @param WebFilesystem $webFilesystem
     * @param ACL $acl
     * @param ConditionOperator $conditionOperator
     */
    public function __construct(Jarves $jarves, WebFilesystem $webFilesystem, ACL $acl, ConditionOperator $conditionOperator)
    {
        $this->jarves = $jarves;
        $this->webFilesystem = $webFilesystem;
        $this->acl = $acl;
        $this->conditionOperator = $conditionOperator;
    }

    public function search($query, Condition $condition = null, $max = 20)
    {
        $result = [];

        $finder = Finder::create()
            ->in('web')
            ->followLinks()
            ->exclude('cache')
            ->exclude('bundles/jarves')
        ;

        $query = trim($query);

        $regexSearch = true;
        $regex = '/' . str_replace(['\*', '_'], ['.*', '.'], preg_quote($query, '/'))  . '/';
        if (preg_match('/^[a-zA-Z\_\-\.]+\*?$/', $query)) {
            //onl query like 'test*';
            $regexSearch = false;
            $query = rtrim($query, '*');
        }

        /** @var SplFileInfo $file */
        foreach ($finder as $file) {
            $path = substr($file->getPath() . '/'. $file->getFilename(), 4);

            if ($regexSearch) {
                if (!preg_match($regex, $file->getFilename())) {
                    continue;
                }
            } else {
                if (0 !== strpos($file->getFilename(), $query)) {
                    continue;
                }
            }

            $result[] = [
                'path' => $path,
                '_label' => $path
            ];

            if (count($result) >= $result) {
                return $result;
            }
        }

        return $result;
    }

    public function patch($pk, $values)
    {
        throw new \Exception('FileStorage::patch not supported');
    }

    public function getCount(Condition $condition = null)
    {
        throw new \Exception('FileStorage::getCount not supported');
    }

    public function clear()
    {
        throw new \Exception('FileStorage::clear not supported');
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
                        $file = $this->webFilesystem->getFile(Tools::urlDecode($value));
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
            $file = $this->webFilesystem->getFile(urldecode($primaryKey['id']));
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

        $path = $this->webFilesystem->getPath($primaryKey['id']);

        return $this->webFilesystem->remove($path);
    }

    /**
     * {@inheritDoc}
     */
    public function add($values, $branchPk = false, $mode = 'into', $scope = 0)
    {
        $parentPath = null;

        if ($branchPk) {
            $parentPath = is_numeric($branchPk['id']) ? $this->webFilesystem->getPath($branchPk['id']) : $branchPk['id'];
        }

        $path = $parentPath ? $parentPath . $values['name'] : $values['name'];

        $this->webFilesystem->write($path, $values['content']);

        return parent::add($values, $branchPk, $mode, $scope);
    }

    /**
     * {@inheritDoc}
     */
    public function update($primaryKey, $values)
    {
        $this->mapPrimaryKey($primaryKey);

        $path = is_numeric($primaryKey['id']) ? $this->webFilesystem->getPath($primaryKey['id']) : $primaryKey['id'];
        $this->webFilesystem->write($path, $values['content']);

        return parent::update($primaryKey, $values);
    }

    /**
     * {@inheritDoc}
     */
    public function getItem($primaryKey, $options = null)
    {
        if (is_array($primaryKey)) {
            $path = is_numeric($primaryKey['id']) ? $this->webFilesystem->getPath($primaryKey['id']) : $primaryKey['id'];
        } else {
            $path = $primaryKey ? : '/';
        }

        if (!$path) {
            return null;
        }
        try {
            $item = $this->webFilesystem->getFile($path);
        } catch (FileNotFoundException $e) {
            return null;
        }

        if ($item) {
            return $item->toArray();
        }
    }

    public function getParents($pk, $options = null)
    {
        $path = is_numeric($pk['id']) ? $this->webFilesystem->getPath($pk['id']) : $pk['id'];

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
        $path = is_numeric($pk['id']) ? $this->webFilesystem->getPath($pk['id']) : $pk['id'];

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
            $path = is_numeric($pk['id']) ? $this->webFilesystem->getPath($pk['id']) : $pk['id'];
        } else {
            $path = '/';
        }

        if ('/' === $path) return null;

        $lastSlash = strrpos($path, '/');
        $parentPath = substr($path, 0, $lastSlash) ?: '/';
        $file = $this->webFilesystem->getFile($parentPath);

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
            $path = is_numeric($pk['id']) ? $this->webFilesystem->getPath($pk['id']) : $pk['id'];
        } else {
            $path = '/';
        }

        $target = is_numeric($targetPk['id']) ? $this->webFilesystem->getPath($targetPk['id']) : $targetPk['id'];
        $target = $target .'/'. basename($path);

        if (!$overwrite && $this->webFilesystem->has($target)){
            return ['targetExists' => true];
        }

        $this->checkAccess($path);
        $this->checkAccess($target);

        return $this->webFilesystem->move($path, $target);
    }

    /**
     * Checks the file access.
     *
     * @param $path
     * 
     * @throws AccessDeniedException
     */
    public function checkAccess($path)
    {
        $file = null;

        try {
            $file = $this->webFilesystem->getFile($path);
        } catch (FileNotFoundException $e) {
            while ('/' !== $path) {
                try {
                    $path = dirname($path);
                    $file = $this->webFilesystem->getFile($path);
                } catch (FileNotFoundException $e) {
                }
            }
        }

        if ($file && !$this->acl->checkUpdate('Core\\File', array('id' => $file->getId()))) {
            throw new AccessDeniedException(sprintf('No access to file `%s`', $path));
        }
    }

    /**
     * {@inheritDoc}
     */
    public function getBranch($pk = null, Condition $condition = null, $depth = 1, $scope = null, $options = null)
    {
        if ($pk) {
            $path = is_numeric($pk['id']) ? $this->webFilesystem->getPath($pk['id']) : $pk['id'];
        } else {
            $path = '/';
        }

        if ($depth === null) {
            $depth = 1;
        }

        try {
            $files = $this->webFilesystem->getFiles($path);
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

            $file['writeAccess'] = $this->acl->checkUpdate('Core\\File', array('id' => $file['id']));

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
