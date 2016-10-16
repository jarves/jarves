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

class SystemConfigTest extends KernelAwareTestCase
{
    public function testSystemConfigTitle()
    {

        $xml = "<config>
  <systemTitle>Peter's Jarves</systemTitle>
</config>";

        $config = new SystemConfig();
        $config->setSystemTitle('Peter\'s Jarves');
        $this->assertEquals($xml, $config->toXml());

        $reverse = new SystemConfig($xml);
        $this->assertEquals($xml, $reverse->toXml());

        $xmlAdditional = '<config asd="fgh">
  <systemTitle>Peter\'s Jarves</systemTitle>
  <custom>fooobarr</custom>
  <otherValues>
    <item>peter</item>
    <item key="foo">hans</item>
  </otherValues>
</config>';

        $config = new SystemConfig($xmlAdditional);
        $config->setSystemTitle('Peter\'s Jarves');
        $this->assertEquals('fooobarr', $config->getAdditional('custom'));
        $this->assertEquals('fgh', $config->getAdditionalAttribute('asd'));
        $this->assertEquals(array('peter', 'foo' => 'hans'), $config->getAdditional('otherValues'));
        $this->assertEquals($xmlAdditional, $config->toXml());
    }

    public function testSystemConfigDb()
    {
        $xml = '<config>
  <database>
    <connections>
      <connection>
        <name>testdb</name>
        <username>peter</username>
      </connection>
    </connections>
  </database>
</config>';
        $config = new SystemConfig();

        $connection = new Connection();
        $connection->setUsername('peter');
        $connection->setType('mysql');
        $connection->setName('testdb');

        $database = new Database();
        $config->setDatabase($database);
        $config->getDatabase()->addConnection($connection);

        $output = $config->toXml();
        $this->assertEquals($xml, $output);

        $reverse = new SystemConfig($xml);
        $this->assertInternalType('array', $reverse->getDatabase()->getConnections());
        $this->assertInstanceOf('\Jarves\Configuration\Connection', $reverse->getDatabase()->getConnections()[0]);
        $this->assertEquals('mysql', $reverse->getDatabase()->getConnections()[0]->getType());
        $this->assertEquals('peter', $reverse->getDatabase()->getConnections()[0]->getUsername());
        $this->assertEquals('testdb', $reverse->getDatabase()->getConnections()[0]->getName());
        $this->assertEquals($xml, $reverse->toXml());
    }

    public function testSystemConfigFile()
    {
        $xml = '<config>
  <file groupPermission="r" everyonePermission="">
    <groupOwner>ftp</groupOwner>
  </file>
</config>';
        $config3 = new SystemConfig();

        $filePermission = new FilePermission();
        $filePermission->setGroupPermission('r');
        $filePermission->setEveryonePermission('');
        $filePermission->setGroupOwner('ftp');
        $config3->setFile($filePermission);

        $this->assertEquals($xml, $config3->toXml());

        $reverse = new SystemConfig($xml);
        $this->assertFalse($reverse->getFile()->getDisableModeChange());
        $this->assertEquals('r', $reverse->getFile()->getGroupPermission());
        $this->assertEquals('', $reverse->getFile()->getEveryonePermission());
        $this->assertEquals('ftp', $reverse->getFile()->getGroupOwner());
        $this->assertEquals($xml, $reverse->toXml());

        $xml = '<config>
  <file disableModeChange="true"/>
</config>';
        $config4 = new SystemConfig();

        $filePermission = new FilePermission();
        $filePermission->setDisableModeChange(true);
        $config4->setFile($filePermission);

        $this->assertEquals($xml, $config4->toXml());

        $reverse = new SystemConfig($xml);
        $this->assertTrue($reverse->getFile()->getDisableModeChange());
        $this->assertEquals($xml, $reverse->toXml());
    }

    public function testSystemConfigCache()
    {
        $xml = '<config>
  <cache service="vendor.other.cache">
    <options>
      <option key="servers">
        <option>127.0.0.1</option>
        <option>192.168.0.1</option>
      </option>
      <option key="compression">true</option>
      <option key="foo">bar</option>
    </options>
  </cache>
</config>';
        $config5 = new SystemConfig();
        $cache = new Cache();
        $cache->setService('vendor.other.cache');
        $cache->setOption('servers', array('127.0.0.1', '192.168.0.1'));
        $cache->setOption('compression', 'true');
        $cache->setOption('foo', 'bar');
        $config5->setCache($cache);

        $this->assertEquals(array('127.0.0.1', '192.168.0.1'), $config5->getCache()->getOption('servers'));

        $this->assertEquals($xml, $config5->toXml());

        $reverse = new SystemConfig($xml);
        $this->assertEquals(array('127.0.0.1', '192.168.0.1'), $reverse->getCache()->getOption('servers'));
        $this->assertEquals('true', $reverse->getCache()->getOption('compression'));
        $this->assertEquals($xml, $reverse->toXml());
    }

    public function testSystemConfigClient()
    {

        $xml = '<config>
  <client service="vendor.custom.client_handling">
    <options>
      <option key="server">127.0.0.1</option>
      <option key="cert">false</option>
    </options>
    <sessionStorage service="vendor.own.storage"/>
  </client>
</config>';

        $config = new SystemConfig();
        $client = new Client();
        $client->setService('vendor.custom.client_handling');
        $client->setOption('server', '127.0.0.1');
        $client->setOption('cert', 'false');
        $config->setClient($client);
        $sessionStorage = new SessionStorage();
        $sessionStorage->setService('vendor.own.storage');
        $client->setSessionStorage($sessionStorage);
        $this->assertEquals($xml, $config->toXml());

        $reverse = new SystemConfig($xml);
        $this->assertInstanceOf('Jarves\Configuration\Client', $reverse->getClient());
        $this->assertEquals('vendor.custom.client_handling', $reverse->getClient()->getService());
        $this->assertEquals('127.0.0.1', $reverse->getClient()->getOption('server'));
        $this->assertEquals('false', $reverse->getClient()->getOption('cert'));
        $this->assertInstanceOf('Jarves\Configuration\SessionStorage', $reverse->getClient()->getSessionStorage());
        $this->assertEquals('vendor.own.storage', $reverse->getClient()->getSessionStorage()->getService());
        $this->assertEquals($xml, $reverse->toXml());
    }
}