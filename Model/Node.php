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

namespace Jarves\Model;

use Propel\Runtime\Collection\ObjectCollection;
use Jarves\Model\Base\Node as BaseNode;

class Node extends BaseNode
{
    protected $collNestedGetLinks;

    protected $parents_cached;

    /**
     * @var string
     */
    protected $path;

    /**
     * Same as getChildren but returns only visible pages and non-folder nodes
     *
     * @param  boolean                 $pWithFolders
     *
     * @return ObjectCollection
     */
    public function getLinks($pWithFolders = false)
    {
        if ($this->collNestedGetLinks === null) {

            if (0 < $this->getRgt()) {
                $types = $pWithFolders ? array(0, 1, 2) : array(0, 1);
                $this->collNestedGetLinks = NodeQuery::create()
                    ->childrenOf($this)
                    ->filterByVisible(1)
                    ->filterByType($types)
                    ->orderByBranch()
                    ->find();
            }
        }

        return $this->collNestedGetLinks;
    }

    /**
     * Whether this node is from type page or tray.
     *
     * @return bool
     */
    public function isRenderable()
    {
        return $this->getType() === 0 || $this->getType() === 3;
    }

    /**
     * Does the current node has (valid) sub links?
     *
     * @return bool
     */
    public function hasLinks()
    {
        $links = $this->getLinks();

        return count($links) !== 0;

    }

    /**
     * Returns all parents.
     *
     * @return mixed
     */
    public function getParents()
    {
        if (!$this->parents_cached) {

            $this->parents_cached = array();

            $ancestors = $this->getAncestors();
            foreach ($ancestors as $parent) {

                if ($parent->getType() !== null && $parent->getType() < 2) { //exclude root node
                    $this->parents_cached[] = $parent;
                }

            }
        }

        return $this->parents_cached;
    }

    /**
     * Generates a path to the current page.
     *
     * level 1 -> level 2 -> page
     *
     * where ' -> ' is a $pDelimiter
     *
     * @param string $pDelimiter
     *
     * @return string
     */
    public function getPath($pDelimiter = ' » ')
    {
        if (null === $this->path) {
            $parents = $this->getParents();

            $path = $this->getDomain()->getDomain();
            foreach ($parents as &$parent) {
                $path .= $pDelimiter . $parent->getTitle();
            }

            $path .= $pDelimiter . $this->getTitle();
            $this->path = $path;
        }

        return $this->path;
    }

    /**
     * @param string $path
     */
    public function setPath($path)
    {
        $this->path = $path;
    }

}
