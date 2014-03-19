<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Base\Node;

class NavigationExtension extends \Twig_Extension
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
        return 'navigation';
    }

    public function getFunctions()
    {
        return array(
            'navigationLevel' => new \Twig_Function_Method($this, 'navigationLevel', [
                    'is_safe' => ['html']
                ]),
            'navigationNode' => new \Twig_Function_Method($this, 'navigationNode', [
                    'is_safe' => ['html']
                ])
        );
    }

    public function navigationNode($nodeOrId, $view = 'JarvesBundle:Default:navigation.html.twig')
    {
        $navigation = $this->getJarves()->getNavigation();

        $id = $nodeOrId;
        if ($id instanceof Node) {
            $id = $nodeOrId->getId();
        }

        $options = [
            'id' => $id,
            'template' => $view
        ];

        return $navigation->get($options);
    }

    public function navigationLevel($level, $view = 'JarvesBundle:Default:navigation.html.twig')
    {
        $navigation = $this->getJarves()->getNavigation();

        $options = [
            'level' => $level,
            'template' => $view
        ];

        return $navigation->get($options);
    }

}