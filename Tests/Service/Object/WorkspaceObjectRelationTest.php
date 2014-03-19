<?php

namespace Jarves\Tests\Service\Object;

use Jarves\Propel\WorkspaceManager;
use Jarves\Tests\KernelAwareTestCase;
use Test\Model\ItemCategoryQuery;
use Test\Model\ItemQuery;

class WorkspaceObjectRelationTest extends KernelAwareTestCase
{
    public function testThroughPropel()
    {
        WorkspaceManager::setCurrent(0);

        ItemQuery::create()->deleteAll();
        ItemCategoryQuery::create()->deleteAll();

        WorkspaceManager::setCurrent(0);
        //todo
    }

}
