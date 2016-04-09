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

namespace Jarves\Tests\Jarves;

use Jarves\Configuration\Condition;
use Jarves\Tests\KernelAwareTestCase;

class ConditionTest extends KernelAwareTestCase
{
    public function testExtractFields()
    {
        $condition = Condition::create(['title', '=', 'test title']);
        $fields = $this->getConditionOperator()->extractFields($condition);

        $this->assertEquals(['title'], $fields);
    }
}
