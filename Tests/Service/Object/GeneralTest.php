<?php

namespace Jarves\Tests\Service\Object;

use Jarves\Tests\KernelAwareTestCase;

class GeneralTest extends KernelAwareTestCase
{
    public function testObject()
    {
        $definition = $this->getObjects()->getDefinition('Test\\Test');
        $this->assertNotEmpty($definition);
        $this->assertInstanceOf('Jarves\Configuration\Object', $definition);

        $this->assertEquals('Test', $definition->getId());
        $this->assertEquals('name', $definition->getLabel());

        $objectClass = $this->getObjects()->getClass('Test\\Test');
        $this->assertNotEmpty($objectClass);
        $this->assertInstanceOf('Jarves\ORM\ORMAbstract', $objectClass);
    }
}
