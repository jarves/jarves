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

use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Yaml\Yaml;

class ConfigureTravisCommand extends AbstractCommand
{

    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:configuration:travis')
            ->setDescription('Builds the database configuration for travis ci.')
            ->addArgument('type', InputArgument::REQUIRED, 'database type: mysql|pgsql|sqlite')
            ->addArgument('database-name', InputArgument::REQUIRED, 'database name')
            ->addArgument('username', InputArgument::OPTIONAL, 'database login username')
            ->addOption('pw', null, InputOption::VALUE_OPTIONAL)
            ->addOption('server', null, InputOption::VALUE_OPTIONAL, 'hostname or ip. for SQLITE the path')
            ->addOption('port', null, InputOption::VALUE_OPTIONAL)
            ->setHelp('
You can set with this command configuration values inside the app/config/config.jarves.xml file.
');
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $container = $this->getContainer();

        $rootDir = $container->getParameter('kernel.root_dir');
        $file = sprintf('%s/config/parameters.yml', $rootDir);

        $yaml = Yaml::parse(file_get_contents($file));

        $yaml['parameters']['database_type'] = $input->getArgument('type');
        $yaml['parameters']['database_name'] = $input->getArgument('database-name');
        $yaml['parameters']['database_user'] = $input->getArgument('username');
        $yaml['parameters']['database_password'] = $input->getOption('pw');

        $server = $input->getOption('server') ?: '127.0.0.1';
        $yaml['parameters']['database_server'] = $server;

        file_put_contents($file, Yaml::dump($yaml));

        $output->writeln(sprintf('File "%s" updated.', $file));
    }
}
