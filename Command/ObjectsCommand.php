<?php

namespace Jarves\Command;

use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;

class ObjectsCommand extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:objects')
            ->setDescription('Shows all available objects.')
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
        $filterByBundle = false;
        if ($filterByObjectKey) {
            $filterByBundle = explode('/', $filterByObjectKey)[0];
        }
        $verbose = !!$filterByObjectKey ?: $input->getOption('verbose') ;

        foreach ($jarves->getConfigs() as $bundleConfig) {
            if ($filterByBundle && $filterByBundle !== $bundleConfig->getName()) {
                continue;
            }
            $output->writeln(sprintf(PHP_EOL . '<info>Bundle @%s:</info>', $bundleConfig->getBundleName()));
            $objects = $bundleConfig->getObjects();
            if (!$objects) {
                $output->writeln('  - objects.');
            } else {
                if ($verbose) {
                    foreach ($objects as $object) {
                        if ($filterByObjectKey && $filterByObjectKey !== $object->getKey()) {
                            continue;
                        }
                        $output->writeln(sprintf('<info> Object: %s</info>', $object->getKey()));
                        $output->writeln(sprintf(' =================================================================='));
                        $table = new Table($output);
                        $table->setStyle('compact');
                        $table->setHeaders(['property', 'value']);
                        foreach ($object->toArray() as $key => $value) {
                            if ('browserOptions' === $key || 'fields' === $key || 'browserColumns' === $key) {
                                $newValue = [];
                                foreach ($value as $field) {
                                    $newValue[] = sprintf('<info>%s</info> (%s): %s', $field['id'], $field['type'], @$field['label']);
                                }
                                $value = join("\n", $newValue);
                            }

                            if (null === $value) {
                                $value = 'null';
                            } else if (is_array($value)) {
                                $value = json_encode($value);
                            } else if (is_bool($value)) {
                                $value = $value ? 'true' : 'false';
                            } else if (!is_scalar($value)) {
                                $value = $value->toArray();
                            }
                            $table->addRow([$key, $value]);
                        }
                        $table->render();


                        $output->writeln('');
                        $output->writeln(' REST API Controller');

                        /** @var $router \Symfony\Component\Routing\Router */
                        $router = $this->getContainer()->get('router');
                        /** @var $collection \Symfony\Component\Routing\RouteCollection */
                        $collection = $router->getRouteCollection();
                        $allRoutes = $collection->all();
                        $table = new Table($output);
                        $table->setStyle('compact');
                        $table->setHeaders(['Http method', 'path', 'controller']);

                        /** @var $route \Symfony\Component\Routing\Route */
                        foreach ($allRoutes as $route) {
                            if ($route->getDefault('_jarves_object') === $object->getKey()) {
                                $table->addRow([
                                    join(',', $route->getMethods()),
                                    $route->getPath(),
                                    $route->getDefault('_controller')
                                ]);
                            }
                        }
                        $table->render();

                    }
                } else {
                    $table = new Table($output);
                    $table->setHeaders(['key', 'label', 'labelField', 'table']);
                    foreach ($objects as $object) {
                        $table->addRow([
                            $object->getKey(),
                            $object->getLabel(),
                            $object->getLabelField(),
                            $object->getTable(),
                        ]);
                    }
                    $table->render();
                }
            }
        }
    }
}
