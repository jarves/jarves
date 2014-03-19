<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;

class NodeUrlExtension extends \Twig_Extension
{
    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return \Jarves\Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
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
        return $this->getJarves()->getNodeUrl($nodeOrId);
    }

}