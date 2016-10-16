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
use Propel\Generator\Exception\BuildException;
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
     * @param SystemConfig $systemConfig
     */
    public function setSystemConfig(SystemConfig $systemConfig)
    {
        $this->systemConfig = $systemConfig;
    }

    /**
     * @return SystemConfig
     */
    public function getSystemConfig()
    {
        return $this->systemConfig;
    }


}