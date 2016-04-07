<?php

namespace Jarves\Storage;

use Jarves\ConditionOperator;
use Jarves\Configuration\Condition;
use Jarves\Filesystem\Filesystem;
use Jarves\Jarves;
use Jarves\Tools;

class ViewStorage extends AbstractStorage
{
    /**
     * @var Jarves
     */
    private $jarves;

    /**
     * @var Filesystem
     */
    private $localFilesystem;

    /**
     * @var ConditionOperator
     */
    private $conditionOperator;

    /**
     * @param Jarves $jarves
     * @param Filesystem $localFilesystem
     * @param ConditionOperator $conditionOperator
     */
    public function __construct(Jarves $jarves, Filesystem $localFilesystem, ConditionOperator $conditionOperator)
    {
        $this->jarves = $jarves;
        $this->localFilesystem = $localFilesystem;
        $this->conditionOperator = $conditionOperator;
    }

    /**
     * {@inheritDoc}
     */
    public function getItem($pk, $options = null)
    {
        $path = $pk['path'];

        $file = $this->jarves->resolvePath($path, 'Resources/views/', true);
        $fileObj = $this->localFilesystem->getFile($file);

        return $fileObj->toArray();
    }

    /**
     * {@inheritDoc}
     */
    public function getItems(array $filter = null, Condition $condition = null, $options = null)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function remove($primaryKey)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function add($values, $branchPk = null, $mode = 'into', $scope = null)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function update($primaryKey, $values)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function patch($primaryKey, $values)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function getCount(Condition $condition = null)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function clear()
    {
    }

    /**
     * {@inheritDoc}
     */
    public function getPrimaryKeys()
    {
        return parent::getPrimaryKeys();
    }

    /**
     * {@inheritDoc}
     */
    public static function normalizePath(&$path)
    {
        $path = str_replace('.', '/', $path); //debug

        if (substr($path, -1) == '/') {
            $path = substr($path, 0, -1);
        }

    }

    /**
     * {@inheritDoc}
     */
    public function getBranch($pk = null, Condition $condition = null, $depth = 1, $scope = null, $options = null)
    {
        $result = null;

        $path = $pk['path'];
        if ($depth === null) {
            $depth = 1;
        }

        $path = '@' . trim($path, '/@');
        $path = str_replace(':', '/', $path);

        $c = 0;
        $offset = $options['offset'];
        $limit = $options['limit'];
        $result = array();

        if (!$path) {

            $result = array();
            $bundles = array_keys($this->jarves->getBundles());
            foreach ($bundles as $bundleName) {
                $directory = $this->jarves->resolvePath('@' . $bundleName, 'Resources/views', true);
                $file = $this->localFilesystem->getFile($directory);
                if (!$file) {
                    continue;
                }
                $file = $file->toArray();

                $file['name'] = $bundleName;
                $file['path'] = $bundleName;
                if ($offset && $offset > $c) {
                    continue;
                }
                if ($limit && $limit < $c) {
                    continue;
                }
                if ($condition && !$this->conditionOperator->satisfy($condition, $file)) {
                    continue;
                }
                $c++;

                if ($depth > 0) {
                    $children = self::getBranch(array('path' => $bundleName), $condition, $depth - 1);
                    $file['_childrenCount'] = count($children);
                    if ($depth > 1 && $file['type'] == 'dir') {
                        $file['_children'] = $children;
                    }
                }
            }
        } else {

            $directory = $this->jarves->resolvePath($path, 'Resources/views', true) . '/';
            if (!$this->localFilesystem->has($directory)) {
                return [];
            }

            $files = $this->localFilesystem->getFiles($directory);

            foreach ($files as $file) {

                $item = $file->toArray();

                if ($condition && $condition->hasRules() && !$this->conditionOperator->satisfy($condition, $item, 'jarves/file')) {
                    continue;
                }

                $c++;
                if ($offset && $offset >= $c) {
                    continue;
                }
                if ($limit && $limit < $c) {
                    continue;
                }

                $item = array(
                    'name' => $item['name'],
                    'path' => $this->buildPath($path . '/' . Tools::getRelativePath($item['path'], $directory))
                );

                if ($file->isDir()) {
                    $children = self::getBranch(array('path' => $item['path']), $condition, $depth - 1);
                    foreach ($children as $child) {
                        $child['name'] = $item['name'] . '/' . $child['name'];
                        $result[] = $child;
                    }
                }


                if ($file->isFile()) {
                    $result[] = $item;
                }
            }
        }

        return $result;
    }

    public function buildPath($path)
    {
        if ('@' === substr($path, 0, 1)) {
            $path = substr($path, 1);
        }

        $path = str_replace('//', '/', $path);
        $path = preg_replace('/\/|:/', ':', $path, 2);

        if (1 === substr_count($path, ':')) {
            $path = str_replace(':', '::', $path);
        }

        return $path;
    }

}
