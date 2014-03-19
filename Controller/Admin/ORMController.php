<?php

namespace Jarves\Controller\Admin;

use Jarves\Controller;
use Jarves\Propel\PropelHelper;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class ORMController extends Controller
{
    protected function getPropelHelper()
    {
        $propelHelper = new PropelHelper($this->getJarves());
        return $propelHelper;
    }

    /**
     *
     * @Rest\Get("admin/system/orm/build")
     */
    public function build()
    {
        $modelBuilder = $this->getJarves()->getModelBuilder();
        $modelBuilder->build();
        return true;
    }

}
