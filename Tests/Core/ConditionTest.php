<?php

namespace Jarves\Tests\Jarves;

use Jarves\Configuration\Condition;
use Jarves\Tests\TestCase;

class ConditionTest extends TestCase
{
    public function testExtractFields()
    {
        $condition = Condition::create(['title', '=', 'test title']);
        $fields = $condition->extractFields();

        $this->assertEquals(['title'], $fields);
    }
}
