<?php

namespace Jarves\EventListener;

use Jarves\ACL;
use Jarves\PageStack;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\GetResponseEvent;

class SecurityFirewallListener
{
    /**
     * @var \Symfony\Component\DependencyInjection\ContainerInterface
     */
    protected $container;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    public function onKernelRequest(GetResponseEvent $event)
    {
        /** @var PageStack $pageStack */
        $pageStack = $this->container->get('jarves.page_stack');

        /** @var ACL $acl */
        $acl = $this->container->get('jarves.acl');

        if ($pageStack->isAdmin()) {
            $whiteList = [
                '',
                '/admin/backend/css',
                '/admin/backend/script',
                '/admin/ui/languages',
                '/admin/ui/language',
                '/admin/ui/language-plural',
                '/admin/login',
                '/admin/logged-in'
            ];

            $adminPrefix = $pageStack->getAdminPrefix();

            $url = substr($event->getRequest()->getPathInfo(), strlen($adminPrefix));
            if (in_array($url, $whiteList)) {
                return;
            }

            if (!$pageStack->getUser() || !$acl->check('JarvesBundle:EntryPoint', $url)) {
                $response = new Response(json_encode(
                    [
                        'status' => 403,
                        'error' => 'AccessDeniedException',
                        'message' => 'Access denied.' . (!$pageStack->getUser() ? ' Not logged in.' : ''),
                    ],
                    JSON_PRETTY_PRINT
                ), 403);

                $response->headers->set('Content-Type', 'application/json');
                $event->setResponse($response);
            }
        }
    }

} 