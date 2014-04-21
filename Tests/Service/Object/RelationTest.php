<?php

namespace Jarves\Tests\Service\Object;

use Jarves\Propel\StandardEnglishPluralizer;
use Jarves\Tests\KernelAwareTestCase;
use Test\Model\ContentElementItemQuery;
use Test\Model\ItemCategoryQuery;
use Test\Model\ItemQuery;

class RelationTest extends KernelAwareTestCase
{
    public function testManyToOneVirtualField()
    {
        $testItemCategory = $this->getJarves()->getObjects()->getDefinition('test/itemCategory');
        $field = $testItemCategory->getField('items');
        $this->assertInstanceOf('Jarves\Configuration\Field', $field);
        $this->assertEquals('items', $field->getId());
        $this->assertTrue($field->isVirtual());
        $this->assertEquals('Auto Object Relation (test/itemCategory)', $field->getLabel());
    }

    public function getPluralizerData()
    {
        return [
            ['sheep', 'sheep'],
            ['children', 'child'],
            ['aliases', 'alias'],
            ['asses', 'ass'],
            ['categories', 'category'],
            ['albums', 'album'],
            ['Employees', 'Employee'],
        ];
    }

    /**
     * @dataProvider getPluralizerData
     */
    public function testSingulizer($plural, $singular)
    {
        $pluralizer = new StandardEnglishPluralizer();
        $this->assertEquals($singular, $pluralizer->getSingularForm($plural));
    }

    /**
     * @dataProvider getPluralizerData
     */
    public function testPluralizer($plural, $singular)
    {
        $pluralizer = new StandardEnglishPluralizer();
        $this->assertEquals($plural, $pluralizer->getPluralForm($singular));
    }

    public function testPropelRefName()
    {
        $reflection = new \ReflectionClass('Test\Model\Item');
        $this->assertTrue($reflection->hasMethod('getCategories'), 'Item has getCategories');
        $this->assertTrue($reflection->hasMethod('getOneCategory'), 'Item has getOneCategory');

        $reflection = new \ReflectionClass('Test\Model\ItemCategory');
        $this->assertTrue($reflection->hasMethod('getItems')); //<objectRefRelationName>Items</objectRefRelationName>
        $this->assertTrue($reflection->hasMethod('getCategoryCrossItems')); //<objectRefRelationName>CategoryCrossItems</objectRefRelationName>
    }

    /**
     * @group test
     */
    public function testContentElements()
    {
        ContentElementItemQuery::create()->deleteAll();
        $contents = array();

        $contents[] = array(
            'slotId' => 1,
            'type' => 'text',
            'content' => 'Hello World'
        );

        $contents[] = array(
            'slotId' => 2,
            'type' => 'text',
            'content' => 'Hello Peter'
        );

        $data = array(
            'name' => 'Peter',
            'content' => $contents
        );
        $pk = $this->getJarves()->getObjects()->add('test/contentElementItem', $data);

        $addedItem = $this->getJarves()->getObjects()->get('test/contentElementItem', $pk);

        $this->assertEquals('Peter', $addedItem['name']);
        $this->assertCount(2, $addedItem['content']);
        $this->assertEquals('Hello World', $addedItem['content'][0]['content']);
        $this->assertEquals('Hello Peter', $addedItem['content'][1]['content']);
    }

    public function testManyToOne()
    {
        ItemQuery::create()->deleteAll();
        ItemCategoryQuery::create()->deleteAll();

        $id = uniqid();

        $newItemCategory = [
            'name' => 'Test Category ' . $id,
            'items' => [
                ['title' => 'Test Item ' . $id. ' 1'],
                ['title' => 'Test Item ' . $id. ' 2']
            ]
        ];

        $added = $this->getJarves()->getObjects()->add('test/itemCategory', $newItemCategory);

        $this->assertGreaterThan(0, $added['id']);

        $category = ItemCategoryQuery::create()->findOneById($added['id']);
        $items = $category->getItems();

        $this->assertCount(2, $items);

        $this->assertEquals('Test Item ' . $id. ' 1', $items[0]->getTitle());
        $this->assertEquals('Test Item ' . $id. ' 2', $items[1]->getTitle());
    }
}
