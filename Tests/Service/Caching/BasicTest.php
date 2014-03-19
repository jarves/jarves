<?php

namespace Jarves\Tests\Service\Caching;

use Jarves\Tests\KernelAwareTestCase;

class BasicTest extends KernelAwareTestCase
{
    public function testGeneral()
    {
        $cache = $this->getJarves()->getSystemConfig()->getCache(true);
        $class = $cache->getClass();

        $this->assertEquals('Jarves\Cache\Files', $class);

        //invalidation check
        $this->assertTrue($this->getJarves()->getCache()->set('core/test/2', 'Test Object number 2'));

        $this->assertTrue($this->getJarves()->invalidateCache('core/test'));
        usleep(1000*50); //50ms
        $this->assertNull($this->getJarves()->getCache()->get('core/test/2'));

        //without invalidation
        $this->assertTrue($this->getJarves()->getCache()->set('core/test/2', 'Test Object number 2'));
        $this->assertEquals('Test Object number 2', $this->getJarves()->getCache()->get('core/test/2'));
    }

}
