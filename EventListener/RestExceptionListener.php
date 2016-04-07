<?php

namespace Jarves\EventListener;

use FOS\RestBundle\View\ViewHandler;
use Jarves\Exceptions\RestException;
use Jarves\Tools;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\GetResponseForExceptionEvent;
use Symfony\Bundle\FrameworkBundle\Templating\TemplateReference;
use FOS\RestBundle\View\View;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class RestExceptionListener
{
    /**
     * @var ContainerInterface
     */
    protected $container;

    function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function onKernelException(GetResponseForExceptionEvent $event)
    {
        if ($this->container->get('jarves.page_stack')->isAdmin()) {
            $exception = $event->getException();
            $statusCode = $exception instanceof HttpExceptionInterface ? $exception->getStatusCode() : 500;

            $view = [
                'status' => $statusCode,
                'error' => get_class($event->getException()),
                'message' => $event->getException()->getMessage()
            ];

            if ($exception instanceof RestException) {
                $view['data'] = $exception->getData();
            }

            $previous = $exception;
            while ($previous = $previous->getPrevious()) {
                $prev = array(
                    'error' => get_class($previous),
                    'message' => $previous->getMessage()
                );
                if ($this->container->get('kernel')->isDebug()) {
                    $trace = Tools::getArrayTrace($previous);

                    $prev['file'] = $previous->getFile();
                    $prev['line'] = $previous->getLine();
                    $prev['trace'] = $trace;
                }
                $view['previous'][] = $prev;
            }

            if ($this->container->get('kernel')->isDebug()) {
                $trace = Tools::getArrayTrace($event->getException());

                $view['file'] = $event->getException()->getFile();
                $view['line'] = $event->getException()->getLine();
                $view['trace'] = $trace;
            }

            $response = new Response(json_encode($view, JSON_PRETTY_PRINT));
            $response->headers->set('Content-Type', 'application/json');
            $event->setResponse($response);
            //why does the kernel send a 500 statusCode ?
        }
    }

} 