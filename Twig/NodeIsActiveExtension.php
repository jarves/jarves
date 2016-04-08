<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\PageStack;
use Jarves\Utils;

class NodeIsActiveExtension extends \Twig_Extension
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
            $url = $this->pageStack->getNodeUrl($current, true, true);
            $purl = $this->pageStack->getNodeUrl($node, true, true);

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