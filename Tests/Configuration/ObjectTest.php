<?php

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
    <class>Core\Models\Test</class>
    <dataModel>custom</dataModel>
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

}