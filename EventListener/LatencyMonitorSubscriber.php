<?php

namespace Jarves\EventListener;

use Jarves\Cache\Backend\CacheInterface;
use Jarves\Jarves;
use Jarves\PageStack;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\FinishRequestEvent;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;
use Symfony\Component\HttpKernel\Event\PostResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class LatencyMonitorSubscriber implements EventSubscriberInterface
{
    /**
     * @var Jarves
     */
    protected $jarves;

    protected $start = 0;

    protected $latency = [];

    /**
     * @var CacheInterface
     */
    private $distributedCache;
    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @param PageStack $pageStack
     * @param CacheInterface $distributedCache
     */
    function __construct(PageStack $pageStack, CacheInterface $distributedCache)
    {
        $this->distributedCache = $distributedCache;
        $this->pageStack = $pageStack;
    }

    public static function getSubscribedEvents()
    {
        return [
            'kernel.request' => [
                'onRequestPre', 2048
            ],
            'kernel.terminate' => [
                'onTerminatePre', 128
            ],
            'kernel.finish_request' => [
                'onFinishRequestPre', 128
            ]
        ];
    }

    public function onRequestPre(GetResponseEvent $event)
    {
        if ($event->getRequestType() !== HttpKernelInterface::MASTER_REQUEST) return;
        $this->start = microtime(true);
    }

    public function onFinishRequestPre(FinishRequestEvent $event)
    {
        if ($event->getRequestType() !== HttpKernelInterface::MASTER_REQUEST) return;
        $key = $this->pageStack->isAdmin() ? 'backend' : 'frontend';

        $this->log($key, microtime(true) - $this->start);
    }

    public function onTerminatePre(PostResponseEvent $event)
    {
        $this->saveLatency();
    }

    public function log($area, $ms)
    {
        $this->latency[$area][] = $ms;
    }

    public function saveLatency()
    {
        $lastLatency = $this->distributedCache->get('core/latency');

        $max = 20;
        $change = false;
        foreach (array('frontend', 'backend', 'cache', 'session') as $key) {
            if (!@$this->latency[$key]) {
                continue;
            }

            $this->latency[$key] = array_sum($this->latency[$key]) / count($this->latency[$key]);

            $lastLatency[$key] = (array)@$lastLatency[$key] ?: array();
            array_unshift($lastLatency[$key], @$this->latency[$key]);
            if ($max < count($lastLatency[$key])) {
                array_splice($lastLatency[$key], $max);
            }
            $change = true;
        }

        if ($change) {
            $this->latency = array();
            $this->distributedCache->set('core/latency', $lastLatency);
        }
    }

}