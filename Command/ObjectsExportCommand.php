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

use Jarves\Admin\FieldTypes\RelationDefinition;
use Jarves\Storage\AbstractStorage;
use Jarves\Storage\NotImplementedException;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\Yaml\Dumper;

class ObjectsExportCommand extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:objects:export')
            ->setDescription('Exports data from all objects or only one.')
            ->addArgument('bundle', InputArgument::OPTIONAL, 'filter by bundle, short version name')
            ->addArgument('object-key', InputArgument::OPTIONAL, 'filter by given object-key')
        ;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $jarves = $this->getJarves();
        $filterByObjectKey = $input->getArgument('object-key');
        $filterByBundle = $input->getArgument('bundle');

        $dumper = new Dumper();

        foreach ($jarves->getConfigs() as $bundleConfig) {
            if ($filterByBundle && strtolower($filterByBundle) !== strtolower($bundleConfig->getName())) {
                continue;
            }

            foreach ($bundleConfig->getObjects() as $object) {
                if ($filterByObjectKey && strtolower($filterByObjectKey) !== strtolower($object->getId())) {
                    continue;
                }

                /** @var AbstractStorage $storage */
                $storage = $this->getContainer()->get($object->getStorageService());
                $storage->configure($object->getKey(), $object);

                try {
                    $data = $storage->export();
                    echo $dumper->dump([$object->getKey() => $data], 15);
                } catch (NotImplementedException $e) {
                    if (strtolower($filterByBundle) === strtolower($bundleConfig->getName()) &&
                        strtolower($filterByObjectKey) === strtolower($object->getId())) {
                        $output->writeln('<error>Your requested object does not support export</error>');
                    }
                }
            }
        }
    }
}
