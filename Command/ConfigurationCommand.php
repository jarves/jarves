<?php

namespace Jarves\Command;

use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class ConfigurationCommand extends AbstractCommand
{

    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:configuration:database')
            ->setDescription('Builds all propel models in jarves bundles.')
            ->addArgument('type', InputArgument::REQUIRED, 'database type: mysql|pgsql|sqlite')
            ->addArgument('database-name', InputArgument::REQUIRED, 'database name')
            ->addArgument('username', InputArgument::OPTIONAL, 'database login username')
            ->addOption('pw', null, InputOption::VALUE_OPTIONAL)
            ->addOption('server', null, InputOption::VALUE_OPTIONAL, 'hostname or ip. for SQLITE the path')
            ->addOption('port', null, InputOption::VALUE_OPTIONAL)
            ->setHelp('
You can set with this command configuration values inside the app/config/config.jarves.xml file.
')
        ;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $systemConfig = $this->getJarves()->getSystemConfig(false);

        $database = $systemConfig->getDatabase(true);

        $mainConnection = $database->getMainConnection();

        $mainConnection->setType($input->getArgument('type'));
        $mainConnection->setName($input->getArgument('database-name'));
        $mainConnection->setUsername($input->getArgument('username'));

        $mainConnection->setPassword($input->getOption('pw'));

        $server = $input->getOption('server') ?: '127.0.0.1';
        if ('sqlite' === $mainConnection->getType()) {
            @touch($server);
            $server = realpath($server);
        }
        $mainConnection->setServer($server);

        $mainConnection->setPort($input->getOption('port'));

        $path = realpath($this->getApplication()->getKernel()->getRootDir().'/..') . '/app/config/config.jarves.xml';
        $systemConfig->save($path);

        $cache = realpath($this->getApplication()->getKernel()->getRootDir().'/..') . '/app/config/config.jarves.xml.cache.php';
        @unlink($cache);

        $output->writeln(sprintf('File `%s` updated.', $path));
    }
}
