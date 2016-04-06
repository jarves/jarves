<?php

namespace Jarves\Tests\Service\Caching;

use Jarves\Tests\KernelAwareTestCase;

class BasicTest extends KernelAwareTestCase
{
    public function testGeneral()
    {
        $cache = $this->getJarves()->getSystemConfig()->getCache(true);
        $service = $cache->getService();

        $this->assertEquals('jarves.cache.backend.files', $service);

        //invalidation check
        $this->assertTrue($this->getCacher()->setFastCache('core/test/2', 'Test Object number 2'));

        $this->assertTrue($this->getCacher()->invalidateCache('core/test'));
        usleep(1000*50); //50ms
        $this->assertNull($this->getCacher()->getFastCache('core/test/2'));

        //without invalidation
        $this->assertTrue($this->getCacher()->setFastCache('core/test/2', 'Test Object number 2'));
        $this->assertEquals('Test Object number 2', $this->getCacher()->getFastCache('core/test/2'));
    }

}
