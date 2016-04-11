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

class Logs extends Model
{
    protected $docBlock = 'Log handling. ClientInfo and stackTrace start with level >= ERROR (400) or level=Debug(100).
        deactivate: Deactivates the internal log handler. Does not affect the additional log handler.
        stackTrace: If the system should include the php stackTrace to each log entry. DEACTIVATE THIS IN PRODUCTIVE SYSTEMS!
        performance: If the system should include the memory usage, duration for each log entry. Is only for Debug(100) logs handled. DEACTIVATE THIS IN PRODUCTIVE SYSTEMS!
        events: If the system should log all fired events. DEACTIVATE THIS IN PRODUCTIVE SYSTEMS!
    ';

    protected $attributes = ['deactivate', 'clientInfo', 'performance', 'events'];

    /**
     * @var bool
     */
    protected $deactivate = false;

    /**
     * @var bool
     */
    protected $clientInfo = false;

    /**
     * @var bool
     */
    protected $stackTrace = false;

    /**
     * @var bool
     */
    protected $performance = false;

    /**
     * @var bool
     */
    protected $events = false;

    /**
     * @param boolean $stackTrace
     */
    public function setStackTrace($stackTrace)
    {
        $this->stackTrace = $this->bool($stackTrace);
    }

    /**
     * @return boolean
     */
    public function getStackTrace()
    {
        return $this->stackTrace;
    }

    /**
     * @param boolean $clientInfo
     */
    public function setClientInfo($clientInfo)
    {
        $this->clientInfo = $clientInfo;
    }

    /**
     * @return boolean
     */
    public function getClientInfo()
    {
        return $this->clientInfo;
    }

    /**
     * @param boolean $performance
     */
    public function setPerformance($performance)
    {
        $this->performance = $this->bool($performance);
    }

    /**
     * @return boolean
     */
    public function getPerformance()
    {
        return $this->performance;
    }

    /**
     * @param boolean $deactivate
     */
    public function setDeactivate($deactivate)
    {
        $this->deactivate = $this->bool($deactivate);
    }

    /**
     * @return boolean
     */
    public function getDeactivate()
    {
        return $this->deactivate;
    }

    public function isActive()
    {
        return !$this->deactivate;
    }

    /**
     * @param boolean $events
     */
    public function setEvents($events)
    {
        $this->events = $this->bool($events);
    }

    /**
     * @return boolean
     */
    public function getEvents()
    {
        return $this->events;
    }

}