<?php

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