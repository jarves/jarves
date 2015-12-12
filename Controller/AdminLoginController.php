<?php

namespace Jarves\Controller;

use Jarves\Admin\AdminAssets;
use Jarves\PageResponse;
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
        if ($this->container->has('profiler')) {
            $this->container->get('profiler')->disable();
        }

        $adminAssets = new AdminAssets($this->getJarves());
        $adminAssets->addMainResources();
        $adminAssets->addLanguageResources();
        $adminAssets->addSessionScripts();
        $adminAssets->appendAngularTemplates();

        $response = $this->getJarves()->getPageResponse();

        $response->setBody("
<jarves-admin>
    <jarves-login></jarves-login>
    <jarves-interface></jarves-interface>
</jarves-admin>
        ");

        $response->setResourceCompression(false);
        $response->setDomainHandling(false);

        $response->setTitle($this->getJarves()->getSystemConfig()->getSystemTitle() . ' | Jarves cms Administration');
        $response->prepare($request);
        return $response;
    }

}
