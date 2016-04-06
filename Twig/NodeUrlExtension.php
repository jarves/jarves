<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\Utils;

class NodeUrlExtension extends \Twig_Extension
{
    /**
     * @var Utils
     */
    private $utils;

    /**
     * @param Utils $utils
     */
    function __construct(Utils $utils)
    {
        $this->utils = $utils;
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
        return $this->utils->getNodeUrl($nodeOrId);
    }
}