<?php

namespace Jarves\Controller;

use Jarves\ACL;
use Jarves\Admin\AdminAssets;
use Jarves\EditMode;
use Jarves\Jarves;
use Jarves\PageStack;
use Jarves\Utils;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * FrontEnd - Page controller
 */
class PageController
{
    /**
     * @var Jarves
     */
    private $jarves;

    /**
     * @var Utils
     */
    private $utils;

    /**
     * @var EditMode
     */
    private $editMode;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var ACL
     */
    private $acl;

    /**
     * @param Jarves $jarves
     * @param Utils $utils
     * @param EditMode $editMode
     * @param PageStack $pageStack
     * @param ACL $acl
     */
    public function __construct(Jarves $jarves, Utils $utils, EditMode $editMode, PageStack $pageStack, ACL $acl)
    {
        $this->jarves = $jarves;
        $this->utils = $utils;
        $this->editMode = $editMode;
        $this->pageStack = $pageStack;
        $this->acl = $acl;
    }


    /**
     * Build the page and return the Response of Core\Jarves::getResponse().
     * @return Response
     *
     * @throws \Exception
     */
    public function handleAction()
    {
        $page = $this->pageStack->getCurrentPage();

        //is link
        if ($page->getType() == 1) {
            $to = $page->getLink();
            if (!$to) {
                throw new \Exception('Redirect failed: ' .
                    sprintf('Current page with title %s has no target link.', $page->getTitle())
                );
            }

            if (intval($to) > 0) {
                return new RedirectResponse($this->utils->getNodeUrl($to), 301);
            } else {
                return new RedirectResponse($to, 301);
            }
        }

        if ($this->editMode->isEditMode()) {
            $adminAssets = new AdminAssets($this->jarves, $this->pageStack, $this->acl);
            $adminAssets->handleKEditor();
        }

        $pageResponse = $this->pageStack->getPageResponse();
        $pageResponse->setRenderFrontPage(true);
        $pageResponse->renderContent();

        return $pageResponse; //new Response('<body>ho</body>');
    }

    /**
     * Returns a permanent(301) redirectResponse object.
     *
     * @return RedirectResponse
     */
    public function redirectToStartPageAction()
    {
        $qs = $this->pageStack->getRequest()->getQueryString();
        $response = new RedirectResponse(($this->pageStack->getRequest()->getBaseUrl() ?: '') . ($qs ? '?' . $qs : ''), 301);

        return $response;
    }
}
