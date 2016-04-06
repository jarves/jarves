<?php

namespace Jarves\Controller\Plugin;

use Jarves\Jarves;
use Jarves\PluginController;
use Jarves\PluginResponse;
use Symfony\Bundle\FrameworkBundle\Templating\EngineInterface;

class UserLogin extends PluginController
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var EngineInterface
     */
    protected $templating;

    /**
     * UserLogin constructor.
     * @param Jarves $jarves
     * @param EngineInterface $templating
     */
    public function __construct(Jarves $jarves, EngineInterface $templating)
    {
        $this->jarves = $jarves;
        $this->templating = $templating;
    }

    public function login()
    {
        return $this->templating->renderResponse('JarvesBundle:User:login.html.twig');
    }
}