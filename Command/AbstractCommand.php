<?php

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
