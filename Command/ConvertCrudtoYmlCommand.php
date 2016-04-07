<?php

namespace Jarves\Command;

use Jarves\ORM\Builder\Propel;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Yaml\Dumper;

class ConvertCrudtoYmlCommand extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:convert-crud-to-yml')
            ->addArgument('path', InputArgument::REQUIRED, 'file path')
            ->setDescription('Converts a PHP class to a yml apiControllerDefinition')
        ;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $path = $input->getArgument('path');

        $phpCode = file_get_contents($path);

        $phpCode = preg_replace('/class [a-zA-Z]+ extends [a-zA-Z\\\\]+\s*\\{/', 'class bla {', $phpCode);
        $phpCode = preg_replace('/namespace [a-zA-Z\\\\]+;/', '', $phpCode);
        $phpCode = str_replace('<?php', '', $phpCode);

        echo $phpCode;
        eval($phpCode);
        $bla = new \bla();

        $array = (array)$bla;

        unset($array['preview']);
        unset($array['export']);
        unset($array['nestedRootRemove']);
        unset($array['nestedRootEdit']);
        unset($array['nestedRootAdd']);
        unset($array['removeIcon']);
        unset($array['editIcon']);
        unset($array['addIcon']);
        unset($array['defaultLimit']);
        unset($array['workspace']);
        unset($array['versioning']);

        $dumper = new Dumper();
        $yaml = $dumper->dump($array, 10);
        print_r($array);

        echo "\n\nYAML----------------:\n\n";
        echo $yaml;
    }
}
