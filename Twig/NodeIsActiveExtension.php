<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\PageStack;
use Jarves\Utils;

class NodeIsActiveExtension extends \Twig_Extension
{
    /**
     * @var Utils
     */
    private $utils;
    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @param PageStack $pageStack
     * @param Utils $utils
     */
    function __construct(PageStack $pageStack, Utils $utils)
    {
        $this->utils = $utils;
        $this->pageStack = $pageStack;
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
        $current = $this->pageStack->getCurrentPage();

        if ($node->getId() == $current->getId()) {
            return true;
        }

        if (!$exact) {
            $url = $this->utils->getNodeUrl($current, true, true);
            $purl = $this->utils->getNodeUrl($node, true, true);

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