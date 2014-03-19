<?php

namespace Jarves;
use Symfony\Bundle\FrameworkBundle\Controller\Controller as sController;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;

class Controller extends sController implements ContainerAwareInterface {

    use ContainerHelperTrait;

    /**
     * @return bool
     */
    public function isAdmin()
    {
        $adminPrefix = $this->getKernel()->getContainer()->getParameter('jarves_admin_prefix');
        if ('/' === substr($adminPrefix, -1)) {
            $adminPrefix = substr($adminPrefix, 0, -1);
        }

        if (!$this->getRequest()) {
            return false;
        }

        return (0 === strpos($this->getRequest()->getPathInfo(), $adminPrefix.'/'));
    }

    public function isEditMode($nodeId = null)
    {
        if ($nodeId) {
            return $this->getRequest() && 1 == $this->getRequest()->get('_jarves_editor')
            && $this->getACL()->checkUpdate(
                'JarvesBundle:Node',
                $nodeId
            );
        }

        return $this->getRequest() && 1 == $this->getRequest()->get('_jarves_editor')
        && $this->getJarves()->getCurrentPage()
        && $this->getACL()->checkUpdate(
            'JarvesBundle:Node',
            $this->getJarves()->getCurrentPage()->getId()
        );
    }
}