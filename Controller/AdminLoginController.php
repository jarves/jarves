<?php

namespace Jarves\Controller;

use Jarves\Admin\AdminAssets;
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
        $adminAssets = new AdminAssets($this->getJarves());
        $adminAssets->addMainResources();
        $adminAssets->addLanguageResources();
        $adminAssets->addSessionScripts();

        $response = $this->getJarves()->getPageResponse();
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

        $response->setTitle($this->getJarves()->getSystemConfig()->getSystemTitle() . ' | Jarves cms Administration');
        $response->prepare($request);
        return $response;
    }

}
