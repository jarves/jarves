<?php

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