<?php

namespace Jarves\Tests\Service\Object;

use Jarves\Tests\KernelAwareTestCase;

use Test\Model\Item;
use Test\Model\Item2;

class ApiTest extends KernelAwareTestCase
{
    public function testPkApi()
    {
        $pk = $this->getObjects()->normalizePk('Test\Item', 24);
        $this->assertEquals(array('id' => 24), $pk);

        $pk = $this->getObjects()->normalizePk('Test\Item', array(24));
        $this->assertEquals(array('id' => 24), $pk);

        $pk = $this->getObjects()->normalizePk('Test\Item', array('id' => 24));
        $this->assertEquals(array('id' => 24), $pk);

        $pk = $this->getObjects()->normalizePkString('Test\Item', 24);
        $this->assertEquals(array('id' => 24), $pk);

        $pk = $this->getObjects()->normalizePkString('Test\Item2', '24');
        $this->assertEquals(array('id' => 24, 'id2' => null), $pk);

        $pk = $this->getObjects()->normalizePkString('Test\Item2', '24%2C33');
        $this->assertEquals(array('id' => '24,33', 'id2' => null), $pk);

        $pk = $this->getObjects()->normalizePkString('Test\Item2', '24,5');
        $this->assertEquals(array('id' => 24, 'id2' => 5), $pk);

        $pk = $this->getObjects()->normalizePkString('Test\Item2', '24%2C33,5');
        $this->assertEquals(array('id' => '24,33', 'id2' => 5), $pk);

        $pk = $this->getObjects()->normalizePkString('Test\Item2', '24,5/44,5');
        $this->assertEquals(array('id' => 24, 'id2' => 5), $pk);

        $pk = $this->getObjects()->normalizePk('Test\Item2', 24);
        $this->assertEquals(array('id' => 24, 'id2' => null), $pk);

        $pk = $this->getObjects()->normalizePk('Test\Item2', array(24, 2));
        $this->assertEquals(array('id' => 24, 'id2' => 2), $pk);

        $pk = $this->getObjects()->getObjectUrlId('Test\Item', '25,asd24/');
        $this->assertEquals('25%2Casd24%252F', $pk);

        $pk = $this->getObjects()->getObjectUrlId('Test\Item2', array('21,5', 'asd24/'));
        $this->assertEquals('21%2C5,asd24%252F', $pk);

        $pk = $this->getObjects()->getObjectUrlId('Test\Item2', '215,asd24/');
        $this->assertEquals('215%2Casd24%252F,', $pk);

        $pk = $this->getObjects()->normalizePkString('Test\Item2', '215,asd24');
        $this->assertEquals(array('id' => '215', 'id2' => 'asd24'), $pk);

    }

    public function testCondition()
    {
        $item1 = new Item;
        $item1->setTitle('Item Condition 1 Hi');
        $item1->save();

        $item2 = new Item;
        $item2->setTitle('Item Condition 2 Hi');
        $item2->save();

        $condition1 = array(
            array('id', '=', $item1->getId())
        );

        $condition2 = array(
            array('id', '>=', $item1->getId())
        );

        $condition3 = array(
            array('id', '>', $item1->getId())
        );

        $condition4 = array(
            array('title', '=', 'Item Condition 2 Hi')
        );

        $condition5 = array(
            array('title', 'LIKE', 'Item Condition %')
        );

        $condition6 = array(
            array('title', 'LIKE', 'Item Condition _ Hi')
        );

        $condition7 = array(
            array('title', 'LIKE', 'Item Condition _')
        );

        $arrayItem1 = $this->getObjects()->get('Test\Item', $item1->getId());
        $arrayItem2 = $this->getObjects()->get('Test\Item', $item2->getId());

        $this->assertTrue($this->getObjects()->satisfy($arrayItem1, $condition1));
        $this->assertTrue($this->getObjects()->satisfy($arrayItem1, $condition2));
        $this->assertFalse($this->getObjects()->satisfy($arrayItem1, $condition3));

        $this->assertFalse($this->getObjects()->satisfy($arrayItem2, $condition1));
        $this->assertTrue($this->getObjects()->satisfy($arrayItem2, $condition2));
        $this->assertTrue($this->getObjects()->satisfy($arrayItem2, $condition3));

        $this->assertFalse($this->getObjects()->satisfy($arrayItem1, $condition4));
        $this->assertTrue($this->getObjects()->satisfy($arrayItem2, $condition4));

        $this->assertTrue($this->getObjects()->satisfy($arrayItem1, $condition5));
        $this->assertTrue($this->getObjects()->satisfy($arrayItem2, $condition5));

        $this->assertTrue($this->getObjects()->satisfy($arrayItem1, $condition6));
        $this->assertTrue($this->getObjects()->satisfy($arrayItem2, $condition6));

        $this->assertFalse($this->getObjects()->satisfy($arrayItem1, $condition7));
        $this->assertFalse($this->getObjects()->satisfy($arrayItem2, $condition7));

    }

}
