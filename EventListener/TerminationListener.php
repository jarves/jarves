<?php

namespace Jarves\EventListener;

use Jarves\Jarves;
use Symfony\Component\HttpKernel\Event\PostResponseEvent;

class TerminationListener
{
    /**
     * @var Jarves
     */
    protected $jarves;

    public function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    public function onKernelTerminate(PostResponseEvent $event)
    {
        $this->jarves->terminate();
    }

} 