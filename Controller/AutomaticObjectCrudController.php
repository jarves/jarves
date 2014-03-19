<?php

namespace Jarves\Controller;

/**
 * This class is used for auto-generated rest endPoints for objects.
 */
class AutomaticObjectCrudController extends ObjectCrudController
{
    public function getObject()
    {
        return $this->detectObjectKeyFromPathInfo();
    }
}