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

class RenderContentsExtension extends \Twig_Extension
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
        return $this->container->get('jarves.content.render')->renderContents($contents, $view);
    }

}