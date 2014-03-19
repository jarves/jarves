<?php

namespace Tests\Jarves;

use Jarves\Configuration\Cache;
use Jarves\Configuration\Client;
use Jarves\Configuration\Database;
use Jarves\Configuration\Errors;
use Jarves\Configuration\FilePermission;
use Jarves\Configuration\SessionStorage;
use Jarves\Configuration\SystemConfig;
use Jarves\Configuration\Connection;
use Jarves\Tests\KernelAwareTestCase;

class ConfigTest extends KernelAwareTestCase
{
    public function testBasics()
    {
        $this->assertCount(13, $this->getJarves()->getBundles());
        $this->assertCount(4, $this->getJarves()->getConfigs()->getConfigs());
        $this->assertCount(4, $this->getJarves()->getConfigs()->getConfigs());
    }

    public function testConfigs()
    {
        $config = $this->getJarves()->getConfigs();

        foreach ($config->getConfigs() as $config) {
            $this->assertInstanceOf('Jarves\Configuration\Bundle', $config);
        }
    }

    /**
     * @group test
     */
    public function testBundleConfigs()
    {
        foreach ($this->getJarves()->getBundles() as $bundle => $obj) {
            $bundleConfig = $this->getJarves()->getConfig($bundle);
            if ($bundleConfig) {
                $this->assertInstanceOf('Jarves\Configuration\Bundle', $bundleConfig);
            }
        }

        $bundleConfig = $this->getJarves()->getConfig('JarvesPublicationBundle');
        $this->assertInstanceOf('Jarves\Configuration\Bundle', $bundleConfig);

        $this->assertEquals('JarvesPublicationBundle', $bundleConfig->getBundleName());
        $this->assertEquals('jarvespublication', $bundleConfig->getName());
    }

    public function testBundle()
    {
        foreach ($this->getJarves()->getBundles() as $bundle => $obj) {
            $this->assertInstanceOf('Symfony\Component\HttpKernel\Bundle\BundleInterface', $obj);
        }

        $bundleConfig = $this->getJarves()->getConfig('JarvesPublicationBundle');
        $this->assertInstanceOf('Jarves\Configuration\Bundle', $bundleConfig);

        $this->assertEquals('JarvesPublicationBundle', $bundleConfig->getBundleName());
        $this->assertEquals('jarvespublication', $bundleConfig->getName());
        $this->assertEquals('Jarves\Publication\JarvesPublicationBundle', get_class($bundleConfig->getBundleClass()));

        $this->assertEquals('Jarves\Publication', $bundleConfig->getNamespace());
    }
}