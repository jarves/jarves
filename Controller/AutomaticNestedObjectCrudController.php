<?php

namespace Jarves\Controller;

/**
 * This class is used for auto-generated rest endPoints for objects.
 */
class AutomaticNestedObjectCrudController extends NestedObjectCrudController
{
    public function getObject()
    {
        return $this->detectObjectKeyFromPathInfo();
    }
}