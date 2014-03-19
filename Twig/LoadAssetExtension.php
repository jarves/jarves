<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;

class LoadAssetExtension extends \Twig_Extension
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
        $this->getJarves()->getPageResponse()->loadAssetFile($asset);
    }

    public function loadAssetAtBottom($asset)
    {
        $this->getJarves()->getPageResponse()->loadAssetFileAtBottom($asset);
    }

}