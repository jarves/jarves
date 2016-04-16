<?php

namespace Jarves\EventListener;

use Jarves\ACL;
use Jarves\ACLRequest;
use Jarves\Exceptions\AccessDeniedException;
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

        $editorNodeId = $pageStack->getRequest()->get('_jarves_editor_node');
        $editorDomainId = $pageStack->getRequest()->get('_jarves_editor_domain');
        
        if (null !== $editorNodeId || null !== $editorDomainId) {
            $pk = $editorNodeId ? ['id' => $editorNodeId] : null;
            if (!$acl->isUpdatable('jarves/node', $pk)) {
                throw new AccessDeniedException('Access denied');
            }
        }

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

            $hasUser = (boolean)$pageStack->getUser();
            $aclPath = '/jarves' . $url; //acl rules start always with /jarves
            $hasAccess = $acl->check(ACLRequest::create('jarves/entryPoint', ['path' => $aclPath]));

            if (!$hasUser || !$hasAccess) {
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