<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;

class RenderContentsExtension extends \Twig_Extension
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
        return 'renderContents';
    }

    public function getFilters()
    {
        return array(
            'renderContents' => new \Twig_SimpleFilter('renderContents', [$this, 'renderContents'])
        );
    }

    public function renderContents($contents, $view = '')
    {
        return $this->getJarves()->getContentRender()->renderView($contents, $view);
    }

}