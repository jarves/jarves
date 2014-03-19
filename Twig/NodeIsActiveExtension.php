<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;

class NodeIsActiveExtension extends \Twig_Extension
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
        return 'nodeIsActive';
    }

    public function getFilters()
    {
        return array(
            'isActive' => new \Twig_SimpleFilter('isActive', [$this, 'isActive'])
        );
    }

    public function isActive(Node $node, $exact = false)
    {
        $current = $this->getJarves()->getCurrentPage();

        if ($node->getId() == $current->getId()) {
            return true;
        }

        if (!$exact) {
            $url = $this->getJarves()->getNodeUrl($current, true, true);
            $purl = $this->getJarves()->getNodeUrl($node, true, true);

            if ($url && $purl) {
                $pos = strpos($url, $purl);
                if ($url == '/' || $pos != 0 || $pos === false) {
                    return false;
                } else {
                    return true;
                }
            }
        }
    }

}