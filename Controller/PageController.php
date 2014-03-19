<?php

namespace Jarves\Controller;

use Jarves\Admin\AdminAssets;
use Jarves\PluginController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * FrontEnd - Page controller
 */
class PageController extends PluginController
{

    /**
     * Build the page and return the Response of Core\Jarves::getResponse().
     *
     * @return Response
     */
    public function handleAction()
    {
        $page = $this->getJarves()->getCurrentPage();

        //is link
        if ($page->getType() == 1) {
            $to = $page->getLink();
            if (!$to) {
                throw new \Exception('Redirect failed: ' .
                    sprintf('Current page with title %s has no target link.', $page->getTitle())
                );
            }

            if (intval($to) > 0) {
                return new RedirectResponse($this->getJarves()->getNodeUrl($to), 301);
            } else {
                return new RedirectResponse($to, 301);
            }
        }

        if ($this->getJarves()->isEditMode()) {
            $adminAssets = new AdminAssets($this->getJarves());
            $adminAssets->handleKEditor();
        }

        $pageResponse = $this->getJarves()->getPageResponse();
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
        $qs = $this->getJarves()->getRequest()->getQueryString();
        $response = new RedirectResponse(($this->getJarves()->getRequest()->getBaseUrl() ?: '')  . ($qs ? '?'.$qs:''), 301);

        return $response;
    }
}
