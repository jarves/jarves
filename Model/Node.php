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
use Symfony\Component\HttpFoundation\ParameterBag;

class Node extends BaseNode
{
    protected $collNestedGetLinks;

    /**
     * Parents. Mostly used for breadcrumb.
     *
     * @var Node[]|null
     */
    protected $parents;

    /**
     * Children. Mostly used for breadcrumb.
     *
     * @var Node[]|null
     */
    protected $offspring;

    const TYPE_PAGE = 0;
    const TYPE_LINK = 1;
    const TYPE_FOLDER = 2;
    const TYPE_TRAY = 3;

    /**
     * @var ParameterBag
     */
    public $meta;

    /**
     * @var string
     */
    protected $path;

    public function __construct()
    {
        parent::__construct();
        $this->setType(Node::TYPE_PAGE);
        $this->meta = new ParameterBag();
    }

    /**
     * @param string      $title
     * @param string      $urn
     * @param string|null $theme
     * @param string|null $layout
     *
     * @return Node
     */
    public static function createPage($title, $urn, $theme = null, $layout = null)
    {
        $page = new self();
        $page->setType(self::TYPE_PAGE);
        $page->setTitle($title);
        $page->setUrn($urn);
        $page->setTheme($theme);
        $page->setLayout($layout);

        return $page;
    }

    /**
     * @return string
     */
    public function getCacheKey()
    {
        if (null !== $this->getId()) {
            return (string)$this->getId();
        }

        return $this->getUrn();
    }

    /**
     * Same as getChildren but returns only visible pages and non-folder nodes
     *
     * @param  boolean $pWithFolders
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
     * Returns all parents. Mainly used for breadcrumb.
     *
     * @return Node[]
     */
    public function getParents()
    {
        if (!$this->parents) {

            $this->parents = array();

            if ($this->isNew()) {
                return $this->parents ?: [];
            }

            $ancestors = $this->getAncestors();
            foreach ($ancestors as $parent) {

                if ($parent->getType() !== null && $parent->getType() < 2) { //exclude root node
                    $this->parents[] = $parent;
                }
            }
        }

        return $this->parents;
    }

    /**
     * @param Node $node
     */
    public function addParent(Node $node)
    {
        $this->parents[] = $node;
    }

    /**
     * @return Node[]
     */
    public function getOffspring()
    {
        return $this->offspring ?: [];
    }

    /**
     * @param Node $node
     */
    public function addOffspring(Node $node)
    {
        $this->offspring[] = $node;
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
            foreach ($parents as $parent) {
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
