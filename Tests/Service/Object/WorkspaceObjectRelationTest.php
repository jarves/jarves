<?php
/**
 * This file is part of Jarves.
 *
 * (c) Marc J. Schmidt <marc@marcjschmidt.de>
 *
 *     J.A.R.V.E.S - Just A Rather Very Easy [content management] System.
 *
 *     http://jarves.io
 *
 * To get the full copyright and license information, please view the
 * LICENSE file, that was distributed with this source code.
 */

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
