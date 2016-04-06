<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\PageStack;

class LoadAssetExtension extends \Twig_Extension
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
        return 'loadAsset';
    }

    public function getFunctions()
    {
        return array(
            'loadAsset' => new \Twig_Function_Method($this, 'loadAsset'),
            'loadAssetAtBottom' => new \Twig_Function_Method($this, 'loadAssetAtBottom')
        );
    }

    public function loadAsset($asset)
    {
        $this->pageStack->getPageResponse()->loadAssetFile($asset);
    }

    public function loadAssetAtBottom($asset)
    {
        $this->pageStack->getPageResponse()->loadAssetFileAtBottom($asset);
    }

}