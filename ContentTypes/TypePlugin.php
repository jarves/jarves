<?php

namespace Jarves\ContentTypes;

use Jarves\Model\Content;

use Jarves\Exceptions\PluginException;
use Jarves\Model\ContentInterface;
use Jarves\PageResponse;
use Jarves\PageResponseFactory;
use Jarves\PageStack;
use Jarves\PluginResponse;
use Jarves\PluginResponseInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\GetResponseForControllerResultEvent;
use Symfony\Component\HttpKernel\Event\GetResponseForExceptionEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Jarves\Jarves;
use Jarves\Configuration\Plugin;
use Symfony\Component\HttpKernel\KernelInterface;

class TypePlugin extends AbstractType
{

    /**
     * @var array
     */
    private $plugin;

    /**
     * @var string
     */
    private $bundleName;

    /**
     * @var Plugin
     */
    private $pluginDef;

    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var KernelInterface
     */

    private $kernel;
    /**
     * @var EventDispatcherInterface
     */
    private $eventDispatcher;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var PageResponseFactory
     */
    private $pageResponseFactory;

    /**
     * TypePlugin constructor.
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param KernelInterface $kernel
     * @param EventDispatcherInterface $eventDispatcher
     * @param PageResponseFactory $pageResponseFactory
     */
    function __construct(Jarves $jarves, PageStack $pageStack, KernelInterface $kernel,
                         EventDispatcherInterface $eventDispatcher, PageResponseFactory $pageResponseFactory)
    {
        $this->jarves = $jarves;
        $this->pageStack = $pageStack;
        $this->kernel = $kernel;
        $this->eventDispatcher = $eventDispatcher;
        $this->pageResponseFactory = $pageResponseFactory;
    }

    public function setContent(ContentInterface $content)
    {
        parent::setContent($content);
        $this->plugin = json_decode($content->getContent(), 1);
        $this->bundleName = $this->plugin['bundle'] ?: $this->plugin['module']; //module for BC
    }

    public function exceptionHandler(GetResponseForExceptionEvent $event)
    {
        if ($event->getException() instanceof PluginException) {
            return;
        }

        $event->setException(
            new PluginException(
                sprintf(
                    'The plugin `%s` from bundle `%s` [%s] errored.',
                    $this->plugin['plugin'],
                    $this->bundleName,
                    $this->pluginDef->getController()
                ), null, $event->getException()
            )
        );
    }

    public function fixResponse(GetResponseForControllerResultEvent $event)
    {
        $data = $event->getControllerResult();

        if ($data instanceof PluginResponseInterface) {
            $response = $data;
        } else {
            $response = $this->pageResponseFactory->createPluginResponse($data);
        }

        $event->setResponse($response);
    }

    /**
     * @return bool
     */
    public function isPreview()
    {
        return isset($this->getParameters()['preview']) ? $this->getParameters()['preview'] : false;
    }

    public function render()
    {
        if ($response = $this->pageStack->getPageResponse()->getPluginResponse($this->getContent())) {
            return $response->getContent();
        } elseif ($this->plugin) {
            $config = $this->jarves->getConfig($this->bundleName);

            if (!$config) {
                return sprintf(
                    'Bundle `%s` does not exist. You probably have to install this bundle.',
                    $this->bundleName
                );
            }

            if ($this->pluginDef = $config->getPlugin($this->plugin['plugin'])) {
                $controller = $this->pluginDef->getController();

                if ($this->isPreview()) {
                    if (!$this->pluginDef->isPreview()) {
                        //plugin does not allow to have a preview on the actual action method
                        return ($config->getLabel() ?: $config->getBundleName()) . ': ' . $this->pluginDef->getLabel();
                    }
                }

                //create a sub request
                $request = new Request();
                $request->attributes->add(
                    array(
                        '_controller' => $controller,
                        '_content' => $this->getContent(),
                        '_jarves_is_plugin' => true,
                        'options' => isset($this->plugin['options']) ? $this->plugin['options'] : array()
                    )
                );

                $dispatcher = $this->eventDispatcher;

                $callable = array($this, 'exceptionHandler');
                $fixResponse = array($this, 'fixResponse');

                $dispatcher->addListener(
                    KernelEvents::EXCEPTION,
                    $callable,
                    100
                );

                $dispatcher->addListener(
                    KernelEvents::VIEW,
                    $fixResponse,
                    100
                );

                ob_start();
                $response = $this->kernel->handle($request, HttpKernelInterface::SUB_REQUEST);
                //EventListener\PluginRequestListener converts all PluginResponse objects to PageResponses

                if ($response instanceof PageResponse) {
                    if ($pluginResponse = $response->getPluginResponse($this->getContent()->getId())) {
                        $response = $pluginResponse;
                    }
                }

//                if ($response instanceof PageResponse) {
//                    if ($response->getPluginResponse($this->getContent()->getId())) {
//                        $response = $response->getPluginResponse($this->getContent()->getId());
//                    }
//                }

                $ob = ob_get_clean();

                $dispatcher->removeListener(
                    KernelEvents::EXCEPTION,
                    $callable
                );

                $dispatcher->removeListener(
                    KernelEvents::VIEW,
                    $fixResponse
                );

                return trim($ob) . $response->getContent();
            } else {
                return sprintf(
                    'Plugin `%s` in bundle `%s` does not exist. You probably have to install the bundle first.',
                    $this->plugin['plugin'],
                    $this->bundleName
                );
            }
        }
    }

}