<?php

namespace Jarves\Tests\Configuration;

use Jarves\Configuration\Event;
use Jarves\Tests\KernelAwareTestCase;
use Symfony\Component\EventDispatcher\GenericEvent;

class EventTest extends KernelAwareTestCase
{
    public static $fired = 0;

    public function testConfig()
    {
        $xml = '<event key="core/object/modify" subject="core:domain">
  <clearCache>core/domains.created</clearCache>
  <clearCache>core/domains</clearCache>
</event>';

        $event = new Event($xml, $this->getJarves());

        $this->assertEquals('core/object/modify', $event->getKey());
        $this->assertEquals('core:domain', $event->getSubject());
        $this->assertEquals([
            'core/domains.created',
            'core/domains'
        ], $event->getClearCaches());
        $this->assertEquals($xml, $event->toXml());

        $eventArray = [
            'key' => 'core/object/modify',
            'subject' => 'core:domain',
            'clearCaches' => [
                'core/domains.created',
                'core/domains'
            ]
        ];

        $event = new Event($eventArray, $this->getJarves());

        $this->assertEquals('core/object/modify', $event->getKey());
        $this->assertEquals('core:domain', $event->getSubject());
        $this->assertEquals([
            'core/domains.created',
            'core/domains'
        ], $event->getClearCaches());
        $this->assertEquals($eventArray, $event->toArray());
        $this->assertEquals($xml, $event->toXml());
    }

    public function testCall()
    {

        $xml = '<event key="core/object/modify" subject="core:domain">
  <call>core/test</call>
</event>';

        $event = new Event($xml, $this->getJarves());

        $this->assertEquals('core/object/modify', $event->getKey());
        $this->assertEquals('core:domain', $event->getSubject());
        $this->assertEquals([
            'core/test'
        ], $event->getCalls());

        $this->assertEquals($xml, $event->toXml());
    }

    public function testStandardSubjectEvent()
    {
        $xml = '<event key="core/test" subject="foo">
  <call>Jarves\Tests\Configuration\EventTest::fireEvent</call>
</event>';

        $event = new Event($xml, $this->getJarves());
        $this->getJarvesEventDispatcher()->detachEvents();
        $this->assertCount(0, $this->getJarvesEventDispatcher()->getAttachedEvents());
        $this->getJarvesEventDispatcher()->attachEvent($event);
        $this->assertCount(1, $this->getJarvesEventDispatcher()->getAttachedEvents());

        self::$fired = 0;
        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('foo'));
        $this->assertEquals(1, self::$fired);

        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('foo'));
        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('blaa')); //is not handled, since we have a subject defined
        $this->assertEquals(2, self::$fired);

        $this->getJarvesEventDispatcher()->detachEvents();
        $this->assertCount(0, $this->getJarvesEventDispatcher()->getAttachedEvents());
    }

    public function testStandardEvent()
    {
        $xml = '<event key="core/test">
  <call>Jarves\Tests\Configuration\EventTest::fireEvent</call>
</event>';

        $event = new Event($xml, $this->getJarves());
        $this->getJarvesEventDispatcher()->detachEvents();
        $this->getJarvesEventDispatcher()->attachEvent($event);
        $this->assertCount(1, $this->getJarvesEventDispatcher()->getAttachedEvents());

        self::$fired = 0;
        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('foo'));
        $this->assertEquals(1, self::$fired);

        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('2'));
        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('3'));
        $this->assertEquals(3, self::$fired);

        $this->getJarvesEventDispatcher()->detachEvents();
    }

    public function testConditionEventObject()
    {
        $xml = '<event key="core/test" subject="foo">
  <call>Jarves\Tests\Configuration\EventTest::fireEvent</call>
  <condition>
    <rule key="field1" type="equal">value</rule>
    <and/>
    <rule key="field2" type="greater">2</rule>
    <and/>
    <group>
      <rule key="field3" type="equal">1</rule>
      <or/>
      <rule key="field3" type="equal">1002</rule>
    </group>
  </condition>
</event>';

        $event = new Event($xml, $this->getJarves());

        $array = [
            'key' => 'core/test',
            'subject' => 'foo',
            'calls' => ['Jarves\Tests\Configuration\EventTest::fireEvent'],
            'condition' => [
                ['field1', 'equal', 'value'],
                'and',
                ['field2', 'greater', '2'],
                'and',
                [
                    ['field3', 'equal', 1],
                    'or',
                    ['field3', 'equal', 1002]
                ]
            ]
        ];

        $eventArray = new Event($array, $this->getJarves());

        $this->assertEquals($xml, $event->toXml());
        $this->assertEquals($array, $event->toArray());

        $this->assertEquals($xml, $eventArray->toXml());
        $this->assertEquals($array, $eventArray->toArray());
    }

    public function testCondition()
    {
        $xml = '<event key="core/test" subject="foo">
  <call>Jarves\Tests\Configuration\EventTest::fireEvent</call>
  <condition>
    <rule key="field1" type="equal">50</rule>
    <or/>
    <rule key="field1" type="greater">200</rule>
  </condition>
</event>';

        $event = new Event($xml, $this->getJarves());
        $this->assertEquals($xml, $event->toXml());

        $this->getJarvesEventDispatcher()->detachEvents();
        $this->getJarvesEventDispatcher()->attachEvent($event);

        self::$fired = 0;
        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('foo'));
        $this->assertEquals(0, self::$fired, 'no args, therefore condition not satisfied');

        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('foo', ['field1' => 50]));
        $this->assertEquals(1, self::$fired);
        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('foo', ['field1' => 201]));
        $this->assertEquals(2, self::$fired);

        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('notFoo', ['field1' => 201]));
        $this->assertEquals(2, self::$fired);

        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent('foo', ['field1' => 200]));
        $this->assertEquals(2, self::$fired);

        $this->getEventDispatcher()->dispatch('core/test', new GenericEvent());
        $this->assertEquals(2, self::$fired);

        $this->getEventDispatcher()->dispatch('core/notTest', new GenericEvent());
        $this->assertEquals(2, self::$fired);
        $this->getJarvesEventDispatcher()->detachEvents();
    }

    public function testClearCache()
    {
        $xml = '<event key="core/cache" subject="foo">
  <clearCache>core/test1</clearCache>
  <clearCache>core/test2</clearCache>
</event>';

        $event = new Event($xml, $this->getJarves());
        $this->getJarvesEventDispatcher()->detachEvents();
        $this->getJarvesEventDispatcher()->attachEvent($event);

        $this->getCacher()->setDistributedCache('core/test1', 'test1');
        $this->getCacher()->setDistributedCache('core/test2', 'test2');
        $this->getCacher()->setDistributedCache('core/test2/sub', 'sub');
        $this->assertEquals('test1', $this->getCacher()->getDistributedCache('core/test1'));
        $this->assertEquals('test2', $this->getCacher()->getDistributedCache('core/test2'));
        $this->assertEquals('sub', $this->getCacher()->getDistributedCache('core/test2/sub'));

        $this->getEventDispatcher()->dispatch('core/cache', new GenericEvent());
        $this->assertEquals('test1', $this->getCacher()->getDistributedCache('core/test1'));
        $this->assertEquals('test2', $this->getCacher()->getDistributedCache('core/test2'));
        $this->assertEquals('sub', $this->getCacher()->getDistributedCache('core/test2/sub'));

        $this->getEventDispatcher()->dispatch('core/cache', new GenericEvent('foo'));
        $this->assertNull($this->getCacher()->getDistributedCache('core/test1'));
        $this->assertNull($this->getCacher()->getDistributedCache('core/test2'));
        $this->assertNull($this->getCacher()->getDistributedCache('core/test2/sub'));

        $this->getJarvesEventDispatcher()->detachEvents();
    }

    public static function fireEvent()
    {
        self::$fired++;
    }

}