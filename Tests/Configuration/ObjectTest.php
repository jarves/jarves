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

use Jarves\Configuration\Bundle;
use Jarves\Configuration\Configs;
use Jarves\Tests\KernelAwareTestCase;

class ObjectTest extends KernelAwareTestCase
{
    public function testAttributes()
    {
        $xml = <<<EOF
<bundle>
<objects>
  <object id="Test2">
    <label>Test</label>
    <class>tests.store.core.test2</class>
    <fields>
      <field id="id" type="number" primaryKey="true">
        <label>ID</label>
      </field>
      <field id="name" type="text">
        <label>Name</label>
      </field>
    </fields>
  </object>
</objects>
<objectAttributes>
    <attribute target="asdasd" id="bar" type="text"/>
    <attribute target="nonExistingBundle/ASD" id="bar" type="text"/>
    <attribute target="test/test2" id="foo" type="text"/>
    <attribute target="TestBundle/Test2" id="hans" type="text"/>
</objectAttributes>
</bundle>
EOF;

        $configs = new Configs($this->getJarves());

        $bundle = new Bundle('TestBundle');
        $bundle->initialize($xml);
        $configs->addConfig($bundle);

        $this->assertCount(2, $bundle->getObject('Test2')->getFieldsArray());
        $bundle->boot($configs);
        $this->assertCount(4, $bundle->getObject('Test2')->getFieldsArray());

        $foo = $bundle->getObject('Test2')->getField('foo');
        $this->assertTrue($foo->getAttribute());
    }

    /**
     * @group test
     */
    public function testRelations()
    {
        $xml = <<<EOF
<bundle>
<objects>
  <object id="User">
    <label>Test</label>
    <class>tests.store.core.user</class>
    <fields>
      <field id="id" type="number" primaryKey="true">
        <label>ID</label>
      </field>
      <field id="name" type="text">
        <label>Name</label>
      </field>
      <field id="groupMembership" type="object">
        <label>Group membership</label>
        <object>test/group</object>
        <objectRelation>nToM</objectRelation>
        <objectLabel>name</objectLabel>
      </field>
    </fields>
  </object>
  <object id="Group">
    <label>Test Group</label>
    <class>tests.store.core.group</class>
    <fields>
      <field id="id" type="number" primaryKey="true">
        <label>ID</label>
      </field>
      <field id="name" type="text">
        <label>Name</label>
      </field>
    </fields>
  </object>
</objects>
</bundle>
EOF;

        $configs = new Configs($this->getJarves());
        $this->getJarves()->setConfigs($configs);

        $bundle = new Bundle('TestBundle');
        $bundle->initialize($xml);
        $configs->addConfig($bundle);
        $configs->boot();

        $testObject = $bundle->getObject('User');

        $this->assertCount(1, $testObject->getRelations());
        $this->assertTrue($testObject->hasRelation('groupMembership'));

        $testBundle = $configs->getConfig('TestBundle');
        $this->assertCount(3, $testBundle->getObjects());

        $userGroup = $testBundle->getObject('userGroup');
        $this->assertTrue($userGroup->hasRelation('user'));
        $this->assertTrue($userGroup->hasRelation('groupMembership'));
    }


}