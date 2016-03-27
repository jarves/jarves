<?php

namespace Jarves;

use Symfony\Bundle\FrameworkBundle\Controller\Controller as sController;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

class Controller extends sController implements ContainerAwareInterface
{
    use ContainerHelperTrait;

    /**
     * @return bool
     */
    public function isAdmin()
    {
        return $this->container->get('jarves')->isAdmin();
    }

    public function isEditMode($nodeId = null)
    {
        return $this->container->get('jarves')->isEditMode($nodeId);
    }
}