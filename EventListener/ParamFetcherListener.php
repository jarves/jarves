<?php

namespace Jarves\EventListener;

use FOS\RestBundle\EventListener\ParamFetcherListener as FosParamFetcherListener;
use Jarves\Jarves;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpKernel\Event\FilterControllerEvent;

class ParamFetcherListener extends FosParamFetcherListener
{
    /**
     * @var Jarves
     */
    protected $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        parent::__construct($container, true);
    }

    public function onKernelController(FilterControllerEvent $event)
    {
        if ($this->container->get('jarves.page_stack')->isAdmin()) {
            parent::onKernelController($event);
        }
    }
}