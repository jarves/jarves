<?php

namespace Jarves;

use Symfony\Component\HttpFoundation\Request;

class PluginResponse extends PageResponse
{
    /**
     * @var Request
     */
    private $controllerRequest;

    /**
     *
     * @param Request $request
     */
    public function setControllerRequest(Request $request)
    {
        $this->controllerRequest = $request;
    }

    /**
     *
     * @return Request
     */
    public function getControllerRequest()
    {
        return $this->controllerRequest;
    }
}
