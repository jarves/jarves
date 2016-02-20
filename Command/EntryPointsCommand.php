<?php

namespace Jarves\Command;

use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;

class EntryPointsCommand extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:entrypoints')
            ->setDescription('Shows all available entry points.')
        ;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $jarves = $this->getJarves();
        foreach ($jarves->getConfigs() as $bundleConfig) {
            $output->writeln(sprintf(PHP_EOL . '<info>Bundle @%s:</info>', $bundleConfig->getBundleName()));
            $entryPoints = $bundleConfig->getAllEntryPoints();
            if (!$entryPoints) {
                $output->writeln('  - no entry points.');
            } else {
                $table = new Table($output);
                $table->setHeaders(['fullPath', 'type', 'templateUrl', 'In Menu?']);
                foreach ($entryPoints as $entryPoint) {
                    $row = [
                        $entryPoint->getFullPath(),
                        $entryPoint->getType(),
                        $entryPoint->getTemplateUrl(),
                        $entryPoint->isLink() ? 'Yes' : 'No'
                    ];
                    $table->addRow($row);
                }
                $table->render();
            }
        }
    }
}
