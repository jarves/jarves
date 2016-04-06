<?php

namespace Jarves\EventListener;

use Jarves\Jarves;
use Jarves\Logger\JarvesHandler;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\FilterResponseEvent;
use Symfony\Component\HttpKernel\Event\PostResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class DebuggerSubscriber implements EventSubscriberInterface
{
    /**
     * @var Jarves
     */
    protected $jarves;

    protected $start = 0;

    protected $latency = [];

    /**
     * @var JarvesHandler
     */
    protected $jarvesLogHandler;

    /**
     * @var ContainerInterface
     */
    private $container;

    /**
     * @param ContainerInterface $container
     * @param JarvesHandler $jarvesLogHandler
     */
    function __construct(ContainerInterface $container, JarvesHandler $jarvesLogHandler)
    {
        $this->jarvesLogHandler = $jarvesLogHandler;
        $this->container = $container;
    }

    public static function getSubscribedEvents()
    {
        return [
            KernelEvents::TERMINATE => array('onKernelTerminate', -128),
        ];
    }

    public function onKernelTerminate(PostResponseEvent $event)
    {
        if ($this->container->has('profiler')) {
            /** @var $profiler \Symfony\Component\HttpKernel\Profiler\Profiler */
            $profiler = $this->container->get('profiler');

            if ($profile = $profiler->loadProfileFromResponse($event->getResponse())) {
                $logRequest = $this->jarvesLogHandler->getLogRequest();
                $logRequest->setCounts(json_encode($this->jarvesLogHandler->getCounts()));
                $logRequest->setProfileToken($profile->getToken());
                $logRequest->save();
                return;
            }
        }

        //are there any warnings+?
        if ($this->jarvesLogHandler->getCounts()) {
            $logRequest = $this->jarvesLogHandler->getLogRequest();
            $logRequest->setCounts(json_encode($this->jarvesLogHandler->getCounts()));
            $logRequest->save();
        }

        $this->jarvesLogHandler->resetLogRequest();
    }

}