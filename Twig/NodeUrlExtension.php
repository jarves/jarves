<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\PageStack;
use Jarves\Utils;

class NodeUrlExtension extends \Twig_Extension
{
    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @param PageStack $pageStack
     */
    function __construct(PageStack $pageStack)
    {
        $this->pageStack = $pageStack;
    }


    public function getName()
    {
        return 'nodeUrl';
    }

    public function getFilters()
    {
        return array(
            'url' => new \Twig_SimpleFilter('url', [$this, 'getUrl'])
        );
    }

    public function getFunctions()
    {
        return array(
            'currentUrl' => new \Twig_SimpleFunction('currentUrl', [$this, 'getUrl'])
        );
    }

    public function getUrl($nodeOrId = false)
    {
        return $this->pageStack->getNodeUrl($nodeOrId);
    }
}