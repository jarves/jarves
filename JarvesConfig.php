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

use Jarves\Configuration\Model;
use Jarves\Configuration\SystemConfig;
use Symfony\Component\DependencyInjection\ContainerInterface;

class JarvesConfig
{
    /**
     * @var SystemConfig
     */
    protected $systemConfig;

    /**
     * @var string
     */
    private $rootDir;

    /**
     * @var string
     */
    private $environment;
    /**
     * @var ContainerInterface
     */
    private $container;

    /**
     * @param string $rootDir
     * @param string $environment
     * @param ContainerInterface $container
     */
    public function __construct($rootDir, $environment, ContainerInterface $container)
    {
        $this->rootDir = $rootDir;
        $this->environment = $environment;
        $this->container = $container;
    }

    /**
     * @param bool $withCache
     *
     * @return SystemConfig
     */
    public function getSystemConfig($withCache = true)
    {
        if (null === $this->systemConfig) {

            $configFile = $this->rootDir . '/config/config.jarves.xml';
            $configEnvFile = $this->rootDir . '/config/config.jarves_' . $this->environment . '.xml';
            if (file_exists($configEnvFile)) {
                $configFile = $configEnvFile;
            }

            $cacheFile = $configFile . '.cache.php';
            $systemConfigCached = @file_get_contents($cacheFile);

            $cachedSum = 0;
            if ($systemConfigCached) {
                $cachedSum = substr($systemConfigCached, 0, 32);
                $systemConfigCached = substr($systemConfigCached, 33);
            }

            $systemConfigHash = file_exists($configFile) ? md5(filemtime($configFile)) : -1;

            if ($withCache && $systemConfigCached && $cachedSum === $systemConfigHash) {
                $this->systemConfig = @unserialize($systemConfigCached);
            }

            if (!$this->systemConfig) {
                $configXml = file_exists($configFile) ? file_get_contents($configFile) : [];
                $this->systemConfig = new SystemConfig($configXml);
                file_put_contents($cacheFile, $systemConfigHash . "\n" . serialize($this->systemConfig));
            }

            if (!$this->systemConfig->getDatabase()) {
                $database = $this->container->get('jarves.configuration.database');
                $this->systemConfig->setDatabase($database);
            }
        }

        return $this->systemConfig;
    }


}