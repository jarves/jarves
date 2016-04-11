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

use Jarves\Configuration\Condition;
use Jarves\Jarves;

class EntryPointStorage extends AbstractStorage
{
    /**
     * @var Jarves
     */
    private $jarves;

    /**
     * @param Jarves $jarves
     */
    public function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

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
        $adminUtils = new \Jarves\Admin\Utils($this->jarves);
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
        $adminUtils = new \Jarves\Admin\Utils($this->jarves);

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
//        $adminUtils = new \Jarves\Admin\Utils($this->jarves);
//        $entryPoint = $adminUtils->getEntryPoint('JarvesPublicationBundle');
//        var_dump($entryPoint);
//        exit;

        $result = [];

        foreach ($this->jarves->getBundles() as $bundle) {
            $item = array(
                'path' => $bundle->getName(),
                'title' => $bundle->getName()
            );
            $result[] = $item;

//            $children = $this->getChildrenFlattenList($item['path']);

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
            foreach ($this->jarves->getBundles() as $bundle) {

                $item = array(
                    'path' => $bundle->getName(),
                    'title' => $bundle->getName()
                );

                $this->setChildren(strtolower($bundle->getName()), $item, $depth);

                $result[] = $item;
            }
        } else {

            self::normalizePath($pk['path']);

            $adminUtils = new \Jarves\Admin\Utils($this->jarves);
            $entryPoint = $adminUtils->getEntryPoint($pk['path']);
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
