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

namespace Jarves;

use Symfony\Component\Stopwatch\Stopwatch;

class StopwatchHelper {

    /**
     * @var Stopwatch
     */
    protected $stopwatch;

    function __construct($stopwatch = null)
    {
        $this->stopwatch = $stopwatch;
    }

    /**
     * @param Stopwatch $stopwatch
     */
    public function setStopwatch($stopwatch)
    {
        $this->stopwatch = $stopwatch;
    }

    /**
     * @return Stopwatch
     */
    public function getStopwatch()
    {
        return $this->stopwatch;
    }

    /**
     * @param string $name
     * @param string $category
     */
    public function start($name, $category = null){
        if ($this->stopwatch) {
            $this->stopwatch->start($name, $category);
        }
    }

    /**
     * @param string $name
     */
    public function stop($name){
        if ($this->stopwatch) {
            $this->stopwatch->stop($name);
        }
    }

    /**
     * @param string $name
     */
    public function lap($name){
        if ($this->stopwatch) {
            $this->stopwatch->lap($name);
        }
    }


}