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
            ->addArgument('bundle', InputArgument::REQUIRED, 'filter by bundle, short version name')
            ->addArgument('object-id', InputArgument::OPTIONAL, 'filter by given object-id')
            ->addOption('overwrite', null, InputOption::VALUE_NONE, 'whether existing schema files should be overwritten')
            ->setDescription('Builds all ORM model schema files')
        ;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $modelBuilder = $this->getContainer()->get('jarves.model.builder');

        $filterByObjectId = $input->getArgument('object-id');
        $filterByBundle = $input->getArgument('bundle');
        $overwrite = $input->getOption('overwrite');

        $bundle = $this->getJarves()->getConfig($filterByBundle);
        if (!$bundle) {
            $output->write(sprintf('Bundle for %s not found [%s]', $filterByBundle, implode(', ', array_keys($this->getJarves()->getBundles()))));
            return;
        }

        $objects = [];
        foreach ($bundle->getObjects() as $object) {
            if ($filterByObjectId && strtolower($filterByObjectId) !== strtolower($object->getId())) {
                continue;
            }

            $objects[] = $object;
        }

        /** @var Propel $builder */
        $builder = $modelBuilder->getBuilder('propel');
        $builder->build($objects, $output, $overwrite);
    }
}
