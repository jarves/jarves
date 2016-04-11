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

namespace Jarves\Configuration;

use Symfony\Component\EventDispatcher\GenericEvent;

/**
 * Class Asset
 *
 * Paths are relative to `
 *
 * @bundlePath/Resources/public`.
 */
class Event extends Model
{
    protected $attributes = ['key', 'subject'];

    protected $elementToArray = ['clearCache' => 'clearCaches', 'call' => 'calls'];
    protected $arrayIndexNames = ['clearCaches' => 'clearCache', 'calls' => 'call'];

    /**
     * @var string
     */
    protected $key;

    /**
     * @var string
     */
    protected $subject;

    /**
     * @var string
     */
    protected $desc;

    /**
     * @var array
     */
    protected $clearCaches;

    /**
     * @var array
     */
    protected $calls;

    /**
     * @var array
     */
    protected $serviceCalls;

    /**
     * @var Condition
     */
    protected $condition;

    /**
     * @param string $key
     */
    public function setKey($key)
    {
        $this->key = $key;
    }

    /**
     * @return string
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * @param string $subject
     */
    public function setSubject($subject)
    {
        $this->subject = $subject;
    }

    /**
     * @return string
     */
    public function getSubject()
    {
        return $this->subject;
    }

    /**
     * @param array $clearCaches
     */
    public function setClearCaches(array $clearCaches)
    {
        $this->clearCaches = $clearCaches;
    }

    /**
     * @return array
     */
    public function getClearCaches()
    {
        return $this->clearCaches;
    }

    /**
     * @param array $calls
     */
    public function setCalls(array $calls)
    {
        $this->calls = $calls;
    }

    /**
     * @return array
     */
    public function getCalls()
    {
        return $this->calls;
    }

    /**
     * @param array $serviceCalls
     */
    public function setServiceCalls(array $serviceCalls)
    {
        $this->serviceCalls = $serviceCalls;
    }

    /**
     * @return array
     */
    public function getServiceCalls()
    {
        return $this->serviceCalls;
    }

    /**
     * @param Condition $condition
     */
    public function setCondition(Condition $condition = null)
    {
        $this->condition = $condition;
    }

    /**
     * @return Condition
     */
    public function getCondition()
    {
        return $this->condition;
    }

    /**
     * @param string $desc
     */
    public function setDesc($desc)
    {
        $this->desc = $desc;
    }

    /**
     * @return string
     */
    public function getDesc()
    {
        return $this->desc;
    }

}