<?php

namespace Jarves\Controller;

use Jarves\ACL;
use Jarves\Admin\AdminAssets;
use Jarves\Jarves;
use Jarves\JarvesConfig;
use Jarves\PageStack;
use Jarves\PluginController;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\HttpFoundation\Request;

class AdminLoginController extends PluginController
{
    /**
     * @ApiDoc(
     *  section="Administration",
     *  description="Show the login page of the administration"
     * )
     *
     * @Rest\Get("%jarves_admin_prefix%")
     * @param Request $request
     *
     * @return \Jarves\PageResponse
     */
    public function showLoginAction(Request $request)
    {
        /** @var PageStack $pageStack */
        $pageStack = $this->get('jarves.page_stack');
        /** @var Jarves $jarves */
        $jarves = $this->get('jarves');
        /** @var ACL $acl */
        $acl = $this->get('jarves.acl');

        /** @var JarvesConfig $jarvesConfig */
        $jarvesConfig= $this->get('jarves.config');

        $adminAssets = new AdminAssets($jarves, $pageStack, $acl);
        $adminAssets->addMainResources();
        $adminAssets->addLanguageResources();
        $adminAssets->addSessionScripts();

        $response = $pageStack->getPageResponse();
        $response->addJs(
            "
        tinymce.baseURL =  _path+'bundles/jarves/tinymce',
        window.addEvent('domready', function(){
            jarves.adminInterface = new jarves.AdminInterface();
        });
"
        );

        $response->setResourceCompression(false);
        $response->setDomainHandling(false);
        $response->setRenderFrontPage(false);

        $response->setTitle($jarvesConfig->getSystemConfig()->getSystemTitle() . ' | Jarves Administration');
        $response->prepare($request);
        return $response;
    }

}
