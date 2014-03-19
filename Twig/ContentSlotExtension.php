<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Node;
use Jarves\Controller\PageController;

class ContentSlotExtension extends \Twig_Extension
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
        return 'contentSlot';
    }

    public function getFunctions()
    {
        return array(
            'contentSlot' => new \Twig_Function_Method($this, 'contentSlot', [
                'is_safe' => ['html']
            ])
        );
    }

    public function contentSlot($id, $name = 'Content')
    {
        $params['name'] = $name;

        $render = $this->getJarves()->getContentRender();
        return $render->renderSlot($this->jarves->getCurrentPage()->getId(), $id, $params);
    }

}