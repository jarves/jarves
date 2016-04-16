<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

namespace Jarves\Twig;

use Jarves\Jarves;
use Jarves\Model\Base\Node;
use Jarves\Navigation;

class NavigationExtension extends \Twig_Extension
{
    /**
     * @var Navigation
     */
    private $navigation;

    /**
     * @param Navigation $navigation
     */
    function __construct(Navigation $navigation)
    {
        $this->navigation = $navigation;
    }

    public function getName()
    {
        return 'navigation';
    }

    public function getFunctions()
    {
        return array(
            new \Twig_SimpleFunction('navigationLevel', [$this, 'navigationLevel'], [
                    'is_safe' => ['html'],
                    'needs_environment' => true
                ]),
            new \Twig_SimpleFunction('navigationNode', [$this, 'navigationNode'], [
                    'is_safe' => ['html'],
                    'needs_environment' => true
                ])
        );
    }

    public function navigationNode(
        \Twig_Environment $twig,
        $nodeOrId,
        $view = 'JarvesBundle:Default:navigation.html.twig',
        array $options = [])
    {
        $id = $nodeOrId;
        if ($id instanceof Node) {
            $id = $nodeOrId->getId();
        }

        $options = array_merge($options, [
            'id' => $id,
            'template' => $view
        ]);

        return $this->navigation->getRendered($options, $twig);
    }

    public function navigationLevel(
        \Twig_Environment $twig,
        $level,
        $view = 'JarvesBundle:Default:navigation.html.twig',
        array $options = [])
    {
        $options = array_merge($options, [
            'level' => $level,
            'template' => $view
        ]);

        return $this->navigation->getRendered($options, $twig);
    }

}