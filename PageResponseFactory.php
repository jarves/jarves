<?php

namespace Jarves;


use Jarves\AssetHandler\Container;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Templating\EngineInterface;

class PageResponseFactory
{
    /**
     * @var StopwatchHelper
     */
    private $stopwatch;

    /**
     * @var Container
     */
    private $assetCompilerContainer;

    /**
     * @var EventDispatcherInterface
     */
    private $eventDispatcher;

    /**
     * @var EngineInterface
     */
    private $templating;

    /**
     * @var EditMode
     */
    private $editMode;
    /**
     * @var Jarves
     */
    private $jarves;
    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param StopwatchHelper $stopwatch
     * @param Container $assetCompilerContainer
     * @param EventDispatcherInterface $eventDispatcher
     * @param EngineInterface $templating
     * @param EditMode $editMode
     */
    public function __construct(Jarves $jarves, PageStack $pageStack, StopwatchHelper $stopwatch, Container $assetCompilerContainer,
                                EventDispatcherInterface $eventDispatcher, EngineInterface $templating,
                                EditMode $editMode)
    {
        $this->jarves = $jarves;
        $this->stopwatch = $stopwatch;
        $this->assetCompilerContainer = $assetCompilerContainer;
        $this->eventDispatcher = $eventDispatcher;
        $this->templating = $templating;
        $this->editMode = $editMode;
        $this->pageStack = $pageStack;
    }

    /**
     * @return PageResponse
     */
    public function create($data = '')
    {
        return new PageResponse(
            $data, 200, [],
            $this->pageStack, $this->jarves, $this->stopwatch, $this->assetCompilerContainer, $this->eventDispatcher, $this->templating, $this->editMode
        );
    }

    /**
     * @return PageResponse
     */
    public function createPluginResponse($data = '')
    {
        return new PluginResponse(
            $data, 200, [],
            $this->pageStack, $this->jarves, $this->stopwatch, $this->assetCompilerContainer, $this->eventDispatcher, $this->templating, $this->editMode
        );
    }
}