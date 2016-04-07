<?php

namespace Jarves\EventListener;

use Jarves\Jarves;
use Jarves\PageStack;
use Symfony\Component\HttpKernel\Event\PostResponseEvent;

class TerminationListener
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * TerminationListener constructor.
     * @param Jarves $jarves
     * @param PageStack $pageStack
     */
    public function __construct(Jarves $jarves, PageStack $pageStack)
    {
        $this->jarves = $jarves;
        $this->pageStack = $pageStack;
    }

    public function onKernelTerminate(PostResponseEvent $event)
    {
        $this->pageStack->reset();
        $this->jarves->terminate();
    }

} 