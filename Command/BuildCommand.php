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

use Jarves\ORM\Builder\Propel;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class BuildCommand extends AbstractCommand
{

    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:orm:build:propel')
            ->addArgument('bundle', InputArgument::REQUIRED, 'Bundle name, like JarvesPublicationBundle')
            ->addOption('overwrite', null, InputOption::VALUE_NONE)
            ->setDescription('Builds all ORM model schema files')
        ;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $modelBuilder = $this->getContainer()->get('jarves.model.builder');

        $bundleName = $input->getArgument('bundle');
        $overwrite = $input->getOption('overwrite');

        $bundle = $this->getJarves()->getConfig($bundleName);
        if (!$bundle) {
            $output->write(sprintf('Bundle %s not found [%s]', $bundleName, implode(', ', array_keys($this->getJarves()->getBundles()))));
            return;
        }

        /** @var Propel $builder */
        $builder = $modelBuilder->getBuilder('propel');
        $builder->build($bundle->getObjects(), $output, $overwrite);
    }
}
