<?php

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
