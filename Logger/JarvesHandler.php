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

namespace Jarves\Logger;

use Jarves\Jarves;
use Jarves\Model\Log;
use Jarves\Model\LogRequest;
use Jarves\PageStack;
use Monolog\Handler\AbstractProcessingHandler;
use Monolog\Logger;

class JarvesHandler extends AbstractProcessingHandler
{
    /**
     * @var bool
     */
    protected $inSaving = false;

    /**
     * @var array
     */
    protected $counts = [];

    /**
     * @var array
     */
    protected $logs = [];

    protected $logRequest;
    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @param PageStack $pageStack
     */
    public function __construct(PageStack $pageStack)
    {
        $this->pageStack = $pageStack;
        parent::__construct($level = Logger::DEBUG, $bubble = true);
    }

    /**
     * @param array $logs
     */
    public function setLogs($logs)
    {
        $this->logs = $logs;
    }

    /**
     * @return array
     */
    public function getLogs()
    {
        return $this->logs;
    }

    /**
     * @param array $counts
     */
    public function setCounts($counts)
    {
        $this->counts = $counts;
    }

    /**
     * @return array
     */
    public function getCounts()
    {
        return $this->counts;
    }

    /**
     * Writes the record down to the log of the implementing handler
     *
     * @param  array $record
     * @return void
     */
    protected function write(array $record)
    {
        if ($this->inSaving) {
            //there was a log between our ->save() method
            return;
        }

        if (!isset($this->counts[$record['level']])) {
            $this->counts[$record['level']] = 0;
        }

        $this->counts[$record['level'] + 0]++;

        if ($record['level'] < 300) {
            return;
        }

        $this->inSaving = true;
        $log = new Log();
//
//        if ($record['level'] == 100 && $this->getJarves()->getSystemConfig()->getLogs(true)->getPerformance()) {
//            global $_start;
//            static $lastDebugPoint;
//            $timeUsed = round((microtime(true) - $_start) * 1000, 2);
//            $bytes = convertSize(memory_get_usage(true));
//            $last = $lastDebugPoint ? 'diff ' . round(
//                    (microtime(true) - $lastDebugPoint) * 1000,
//                    2
//                ) . 'ms' : '';
//            $lastDebugPoint = microtime(true);
//            $log->setPerformance("memory: $bytes, {$timeUsed}ms, last: $last");
//        }
//
        $log->setDate(microtime(true));
        $log->setLevel($record['level']);
        $log->setMessage($record['message']);
//        $this->getJarves()->getRequest()->get
//        $log->setUsername(
//            $userName = $this->getJarves()->getClient()->hasSession() && $this->getJarves()->getClient()->getUser(
//            ) ? $this->getJarves()->getClient()->getUser()->getUsername() : 'Guest'
//        );
        $log->setLogRequest($this->getLogRequest());
//
//        if ($record['level'] >= 400 || $record['level'] == 100) {
//            if ($this->getJarves()->getSystemConfig()->getLogs(true)->getStackTrace()) {
//                $stackTrace = debug_backtrace();
//                $log->setStackTrace(json_encode($stackTrace));
//            }
//        }
//
        try {
            $log->save();
        } catch (\Exception $e) {
        }
        $this->inSaving = false;
    }

    /**
     * @return LogRequest
     */
    public function getLogRequest()
    {
        if (!$this->logRequest && $this->pageStack->getRequest()) {
//            if (!$this->jarves->has('profiler')) {
//                $id = md5(mt_rand() . ':' . uniqid());
//            } else {
//                /** @var $profiler \Symfony\Component\HttpKernel\Profiler\Profiler */
//                $profiler = $this->jarves->get('profiler');
//
////                var_dump($profiler->loadProfileFromResponse());
////                exit;
//                //$id = $profiler->ge
//            }
//
//            return $this->kernel->getContainer()->get('profiler')->loadProfileFromResponse($this->response);

            $this->logRequest = new LogRequest();
            $this->logRequest->setId(md5(mt_rand() . ':' . uniqid()));
            $this->logRequest->setDate(microtime(true));
            $this->logRequest->setIp($this->pageStack->getRequest()->getClientIp());
            $this->logRequest->setPath(substr($this->pageStack->getRequest()->getPathInfo(), 0, 254));
            $this->logRequest->setUsername(
                $this->pageStack->getUser()
                    ? $this->pageStack->getUser()->getUsername()
                    : 'Guest'
            );

//            if ($this->jarves->getSystemConfig()->getLogs()->getClientInfo()) {
//                $this->logRequest->setRequestInformation((string)$this->jarves->getRequest());
//            }

        }

        return $this->logRequest;
    }

    /**
     * Resets the current LogRequest. Needed after each request.
     */
    public function resetLogRequest()
    {
        $this->logRequest = null;
    }
}