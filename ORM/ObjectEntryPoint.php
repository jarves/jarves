<?php

namespace Jarves\ORM;

use Admin\Utils;
use Jarves\Configuration\Condition;

class ObjectEntryPoint extends Propel
{
    /**
     * {@inheritDoc}
     */
    public function getItem($pk, $options = null)
    {
        if ('/' === $pk['path']) {
            return array(
                'path' => '/',
                'title' => 'Admin Access (/)'
            );
        }
        $adminUtils = new \Jarves\Admin\Utils($this->getJarves());
        $entryPoint = $adminUtils->getEntryPoint($pk['path']);
        if ($entryPoint) {
            return array(
                 'path' => $pk['path'],
                'type' => $entryPoint['type'],
                'title' => $entryPoint->getLabel() ? $entryPoint->getLabel() . ' ('.$pk['path'].')' : $entryPoint->getPath()
            );
        }
    }

    protected function getChildrenFlattenList($path)
    {
        $adminUtils = new \Jarves\Admin\Utils($this->getJarves());

        $entryPoint = $adminUtils->getEntryPoint($path);
        var_dump($path, $entryPoint);
        $children = [];

        if ($entryPoint['children']) {
            foreach ($entryPoint['children'] as $key => $entryPoint) {
                $children = [
                    'path' => $path . '/' . $key,
                    'type' => $entryPoint['type'],
                    'title' => $entryPoint['title'] ? $entryPoint['title'] . ' (' . $key . ')' : $key
                ];

            }
        }

        return $children;
    }

    /**
     * {@inheritDoc}
     */
    public function getItems(array $filter = null, Condition $condition = null, $options = null)
    {
        $adminUtils = new \Jarves\Admin\Utils($this->getJarves());
        $entryPoint = $adminUtils->getEntryPoint('JarvesPublicationBundle');
        var_dump($entryPoint);
        exit;

        foreach ($this->getJarves()->getBundles() as $bundle) {
            $item = array(
                'path' => $bundle->getName(),
                'title' => $bundle->getName()
            );
            $result[] = $item;

            $children = $this->getChildrenFlattenList($item['path']);

//            $entryPoint = $adminUtils->getEntryPoint($item['path'], true);
//            foreach ($entryPoint['children'] as $key => $entryPoint) {

        }

        return $result;
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
     * Sets the children information at $item directly.
     */
    public function setChildren($path, &$item, $depth)
    {
        $children = $this->getBranch(array('path' => $path), null, $depth - 1);

        if ($children && count($children) > 0) {
            if ($depth > 1) {
                $item['_children'] = $children;
            }
            $item['_childrenCount'] = count($children);
        } else {
            $item['_childrenCount'] = 0;
        }
    }

    /**
     * {@inheritDoc}
     */
    public function getBranch($pk = null, Condition $condition = null, $depth = 1, $scope = null, $options = null)
    {
        $result = null;

        if (!$pk || !$pk['path']) {

            return [
                [
                    'path' => '/',
                    'title' => 'Admin Access'
                ]
            ];

        } else if ('/' == $pk['path']) {
            foreach ($this->getJarves()->getBundles() as $bundle) {

                $item = array(
                    'path' => $bundle->getName(),
                    'title' => $bundle->getName()
                );

                $this->setChildren(strtolower($bundle->getName(true)), $item, $depth);

                $result[] = $item;
            }
        } else {

            self::normalizePath($pk['path']);

            $adminUtils = new \Jarves\Admin\Utils($this->getJarves());
            $entryPoint = $adminUtils->getEntryPoint($pk['path'], true);
            if ($entryPoint && $entryPoint->getChildren()) {

                foreach ($entryPoint->getChildren() as $entryPoint) {
                    $item = array(
                        'path' => $pk['path'] . '/' . $entryPoint->getPath(),
                        'type' => $entryPoint->getType(),
                        'title' => $entryPoint->getLabel() ? $entryPoint->getLabel() : $entryPoint->getPath()
                    );

                    $this->setChildren($pk['path'] . '/' . $entryPoint->getPath(), $item, $depth);

                    $result[] = $item;
                }

            }

        }

        return $result;
    }

    /**
     * {@inheritDoc}
     */
    public function getParent($pk, $options = null)
    {
        if ('/' === $pk['path']) return null;

        $lastSlash = strrpos($pk['path'], '/');
        return [
            'path' => substr($pk['path'], 0, $lastSlash) ?: '/'
        ];
    }
}
