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
                'title' => $entryPoint['title'] ? $entryPoint['title'] . ' (/' . $pk['path'] . ')' : '/'.$pk['path']
            );
        }
    }

    /**
     * {@inheritDoc}
     */
    public function getItems(Condition $condition = null, $options = null)
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
                    'path' => strtolower($bundle->getName()),
                    'title' => $bundle->getName()
                );

                $this->setChildren(strtolower($bundle->getName(true)), $item, $depth);

                $result[] = $item;
            }
        } else {

            self::normalizePath($pk['path']);

            $adminUtils = new \Jarves\Admin\Utils($this->getJarves());
            $entryPoint = $adminUtils->getEntryPoint($pk['path'], true);
            if ($entryPoint && $entryPoint['children'] && count($entryPoint['children']) > 0) {

                foreach ($entryPoint['children'] as $key => $entryPoint) {
                    $item = array(
                        'path' => $pk['path'] . '/' . $key,
                        'type' => $entryPoint['type'],
                        'title' => $entryPoint['title'] ? $entryPoint['title'] . ' (' . $key . ')' : $key
                    );

                    $this->setChildren($pk['path'] . '/' . $key, $item, $depth);

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
