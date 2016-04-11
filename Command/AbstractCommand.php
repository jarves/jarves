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

namespace Jarves\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;

abstract class AbstractCommand extends ContainerAwareCommand
{
    protected $filesystem;

    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
    }

    /**
     * @return \Jarves\Jarves
     */
    protected function getJarves()
    {
        return $this->getContainer()->get('jarves');
    }
}
