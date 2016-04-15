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

use Jarves\ContentRender;
use Symfony\Component\DependencyInjection\ContainerInterface;

class TrayExtension extends \Twig_Extension
{
    /**
     * @var ContainerInterface
     */
    private $container;

    /**
     * @param ContainerInterface $container
     */
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function getName()
    {
        return 'tray';
    }

    public function getFunctions()
    {
        return array(
            new \Twig_SimpleFunction('tray', [$this, 'tray'], array('is_safe' => array('html')))
        );
    }

    public function tray($nodeId, $boxId = 1)
    {
        return $this->container->get('jarves.content.render')->renderSlot($nodeId, $boxId);
    }

}