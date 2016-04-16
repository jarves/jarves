<?php

namespace Jarves\Controller;

use Jarves\ACL;
use Jarves\Admin\AdminAssets;
use Jarves\EditMode;
use Jarves\Exceptions\AccessDeniedException;
use Jarves\Jarves;
use Jarves\Model\NodeQuery;
use Jarves\PageStack;
use Jarves\Utils;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * FrontEnd - Page controller
 */
class PageController
{
    /**
     * @var EditMode
     */
    private $editMode;

    /**
     * @var PageStack
     */
    private $pageStack;
    /**
     * @param EditMode $editMode
     * @param PageStack $pageStack
     */
    public function __construct(EditMode $editMode, PageStack $pageStack)
    {
        $this->editMode = $editMode;
        $this->pageStack = $pageStack;
    }

    /**
     * Build the page and return the PageResponse.
     *
     * Checks for links, mounts etc.
     *
     * @return Response
     * @throws AccessDeniedException
     * @throws \Exception
     */
    public function handleAction()
    {
        $node = $this->pageStack->getCurrentPage();

        //is link
        if ($node->getType() == 1) {
            $to = $node->getLink();
            if (!$to) {
                throw new \Exception('Redirect failed: ' .
                    sprintf('Current page with title %s has no target link.', $node->getTitle())
                );
            }

            if (intval($to) > 0) {
                return new RedirectResponse($this->pageStack->getNodeUrl($to), 301);
            } else {
                return new RedirectResponse($to, 301);
            }
        }

        if ($this->editMode->isEditMode()) {
            $this->editMode->registerEditor();
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
