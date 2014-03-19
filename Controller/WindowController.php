<?php

namespace Jarves\Controller;

use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

/**
 * This class is used for window framework controller
 */
class WindowController extends ObjectCrudController {
    use WindowControllerTrait;
}