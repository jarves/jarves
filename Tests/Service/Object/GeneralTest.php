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

        $objectClass = $this->getObjects()->getStorageController('Test\\Test');
        $this->assertNotEmpty($objectClass);
        $this->assertInstanceOf('Jarves\Storage\AbstractStorage', $objectClass);
    }
}
