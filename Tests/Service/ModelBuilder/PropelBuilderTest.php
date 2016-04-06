<?php

namespace Jarves\Tests\ModelBuilder;

use Jarves\Configuration\Object;
use Jarves\Tests\KernelAwareTestCase;

class PropelBuilderTest extends KernelAwareTestCase
{

    /**
     * @return \Jarves\ORM\Builder\Propel
     */
    protected function getBuilder()
    {
        $modelBuilder = $this->getModelBuilder();

        return $modelBuilder->getBuilder('propel');
    }

    /**
     * @param string $xml
     *
     * @return string
     */
    protected function getSchema($xml)
    {
        $testBundle = $this->getJarves()->getConfig('test');

        $object = new Object($xml, $this->getJarves());
        $testBundle->addObject($object);

        $modelBuilder = $this->getModelBuilder();

        $this->getJarves()->getConfigs()->boot();
        $modelBuilder->bootBuildTime();

        return $this->getBuilder()->getSchema($object);
    }

    /**
     * @expectedException \Jarves\Exceptions\ModelBuildException
     * @expectedExceptionMessage The object `Object1` has no table defined
     */
    public function testMissingTable()
    {
        $xml = '
<object id="Object1">
  <storageService>jarves.storage.propel</storageService>
</object>
';
        $this->getSchema($xml);
    }

    /**
     * @expectedException \Jarves\Exceptions\ModelBuildException
     * @expectedExceptionMessage The object `Object1` has no fields defined
     */
    public function testMissingFields()
    {
        $xml = '
<object id="Object1">
  <storageService>jarves.storage.propel</storageService>
  <table>test_object1</table>
</object>
';
        $this->getSchema($xml);
    }

    public function testSchema()
    {
        $xml = '
<object id="Object1">
  <storageService>jarves.storage.propel</storageService>
  <table>test_object1</table>
  <fields>
    <field id="id" type="number" autoIncrement="true" primaryKey="true"/>
    <field id="title" type="text"/>
  </fields>
</object>
';

        $expected = '<database>
  <table name="test_object1" phpName="Object1">
    <column name="id" type="INTEGER" primaryKey="true" autoIncrement="true"/>
    <column name="title" type="VARCHAR" size="255"/>
    <vendor type="mysql">
      <parameter name="Charset" value="utf8"/>
    </vendor>
  </table>
</database>';

        $schema = $this->getSchema($xml);
        $this->assertEquals($expected, $schema);
    }

    public function testSchema2()
    {
        $xml = '
<object id="Object1">
  <storageService>jarves.storage.propel</storageService>
  <table>test_object1</table>
  <fields>
    <field id="id" type="number" autoIncrement="true" primaryKey="true"/>
    <field id="title" type="text"/>
    <field id="visible" type="checkbox"/>
    <field id="file" type="file"/>
    <field id="text" type="file"/>
    <field id="lang" type="lang"/>
  </fields>
</object>
';

        $expected = '<database>
  <table name="test_object1" phpName="Object1">
    <column name="id" type="INTEGER" primaryKey="true" autoIncrement="true"/>
    <column name="title" type="VARCHAR" size="255"/>
    <column name="visible" type="BOOLEAN"/>
    <column name="file" type="LONGVARCHAR"/>
    <column name="text" type="LONGVARCHAR"/>
    <column name="lang" type="VARCHAR" size="7"/>
    <vendor type="mysql">
      <parameter name="Charset" value="utf8"/>
    </vendor>
  </table>
</database>';

        $schema = $this->getSchema($xml);
        $this->assertEquals($expected, $schema);
    }

    public function testSchemaObject()
    {
        $xml = '
<object id="Object1">
  <storageService>jarves.storage.propel</storageService>
  <table>test_object1</table>
  <fields>
    <field id="id" type="number" autoIncrement="true" primaryKey="true"/>
    <field id="title" type="text"/>
    <field id="owner" type="object">
      <object>jarves/user</object>
      <objectRelation>nTo1</objectRelation>
    </field>
  </fields>
</object>
';

        $expected = '<database>
  <table name="test_object1" phpName="Object1">
    <column name="id" type="INTEGER" primaryKey="true" autoIncrement="true"/>
    <column name="title" type="VARCHAR" size="255"/>
    <column name="owner_id" type="INTEGER"/>
    <foreign-key phpName="Owner" foreignTable="system_user" onDelete="cascade" onUpdate="cascade">
      <reference local="owner_id" foreign="id"/>
    </foreign-key>
    <vendor type="mysql">
      <parameter name="Charset" value="utf8"/>
    </vendor>
  </table>
</database>';

        $schema = $this->getSchema($xml);
        $this->assertEquals($expected, $schema);
    }

    /**
     * @group test
     */
    public function testSchemaPageContents()
    {
        $xml = '
<object id="Object1">
  <storageService>jarves.storage.propel</storageService>
  <table>test_object1</table>
  <fields>
    <field id="id" type="number" autoIncrement="true" primaryKey="true"/>
    <field id="title" type="text"/>
    <field id="contents" type="pageContents"/>
  </fields>
</object>
';

        $expected = '<database>
  <table name="test_object1" phpName="Object1">
    <column name="id" type="INTEGER" primaryKey="true" autoIncrement="true"/>
    <column name="title" type="VARCHAR" size="255"/>
    <column name="layout" type="VARCHAR" size="255"/>
    <column name="theme" type="VARCHAR" size="255"/>
    <vendor type="mysql">
      <parameter name="Charset" value="utf8"/>
    </vendor>
  </table>
</database>';

        $schema = $this->getSchema($xml);
        $this->assertEquals($expected, $schema);
    }

    /**
     * @group test
     */
    public function testSchemaObjectNtoM()
    {
        $xml = '
<object id="ObjectOne">
  <storageService>jarves.storage.propel</storageService>
  <table>test_object_one</table>
  <fields>
    <field id="id" type="number" autoIncrement="true" primaryKey="true"/>
    <field id="title" type="text" size="255"/>
    <field id="owner" type="object">
      <object>jarves/user</object>
      <objectRelation>nToM</objectRelation>
    </field>
  </fields>
</object>
';

        $expected = '<database>
  <table name="test_object_one" phpName="ObjectOne">
    <column name="id" type="INTEGER" primaryKey="true" autoIncrement="true"/>
    <column name="title" type="VARCHAR" size="255"/>
    <vendor type="mysql">
      <parameter name="Charset" value="utf8"/>
    </vendor>
  </table>
</database>';

        $schema = $this->getSchema($xml);
        $this->assertEquals($expected, $schema);

        //test created crosstable
        $testBundle = $this->getJarves()->getConfig('test');
        $this->assertNotNull($object1User = $testBundle->getObject('objectoneuser'));
        $this->assertEquals('ObjectOneUser', $object1User->getId());
        $this->assertTrue($object1User->isCrossRef());

        $this->assertCount(2, $object1User->getFields());
        $this->assertCount(2, $object1User->getRelations());
        $schema = $this->getBuilder()->getSchema($object1User);

        $expectedCrossSchema = '<database>
  <table name="test_object_one_user" phpName="ObjectOneUser" isCrossRef="true">
    <column name="object_one_id" type="INTEGER" primaryKey="true"/>
    <column name="owner_id" type="INTEGER" primaryKey="true"/>
    <foreign-key phpName="ObjectOne" foreignTable="test_object_one" onDelete="cascade" onUpdate="cascade">
      <reference local="object_one_id" foreign="id"/>
    </foreign-key>
    <foreign-key phpName="Owner" foreignTable="system_user" onDelete="cascade" onUpdate="cascade">
      <reference local="owner_id" foreign="id"/>
    </foreign-key>
    <vendor type="mysql">
      <parameter name="Charset" value="utf8"/>
    </vendor>
  </table>
</database>';
        $this->assertEquals($expectedCrossSchema, $schema);
    }

}