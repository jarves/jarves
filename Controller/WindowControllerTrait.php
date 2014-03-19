<?php

namespace Jarves\Controller;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

trait WindowControllerTrait {

    /**
     * @ApiDoc(
     *    description="Returns the class definition/properties of the class behind this Framework-Window"
     * )
     *
     * @Rest\View()
     * @Rest\Options("/")
     *
     * @return array
     */
    public function getInfoAction()
    {
        $obj = $this->getObj();
        $info = $obj->getInfo();
        $info['_isClassDefinition'] = true;

        return $info;
    }
}