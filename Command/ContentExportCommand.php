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

use Jarves\Model\Domain;
use Jarves\Model\DomainQuery;
use Jarves\Model\FileQuery;
use Jarves\Model\Node;
use Jarves\Model\NodeQuery;
use Jarves\Storage\AbstractStorage;
use Propel\Runtime\ActiveQuery\Criteria;
use Propel\Runtime\Map\TableMap;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Yaml\Dumper;
use Symfony\Component\Yaml\Yaml;

class ContentExportCommand extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:content:export')
            ->setDescription('Exports content from nodes and files as a package in app/jarves you can commit in git and import again.');
    }

    /**
     * @param Object $object
     * @return AbstractStorage
     */
    protected function getStorage($object)
    {
        $storage = $this->getContainer()->get($object->getStorageService());
        $storage->configure($object->getKey(), $object);

        return $storage;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $domains = DomainQuery::create()
            ->find();

        $exportPointer = new ExportPointer();

//        $basePath = 'jarves-export/' . date('Ymd-His'). '/';
        $basePath = 'app/jarves/';

        $fs = new Filesystem();
        $fs->remove($basePath);

        foreach ($domains as $domain) {

            $domainData = $domain->toArray(TableMap::TYPE_CAMELNAME);
            $exportPointer->pushPath('website/' . $domainData['domain']);

            $nodes = NodeQuery::create()
                ->filterByDomain($domain)
                ->orderByLft()
                ->filterByLft(1, Criteria::GREATER_THAN)
                ->filterByLvl(1)
                ->find();

            foreach ($nodes as $idx => $node) {
                $this->exportNode($idx, $domain, $node, $exportPointer);
            }

            $domainData = $this->clearData($domainData, ['id', 'startnodeId']);
            if ($domain->hasVirtualColumn('startnodePath')) {
                $domainData['startnode'] = $domain->getVirtualColumn('startnodePath');
            } else {
                $output->writeln(sprintf('<error>Domain %s has no start node defined</error>', $domain->getDomain()));
            }
            $exportPointer->addData($domainData, '.yml');
            $exportPointer->popPath();
        }

        $files = FileQuery::create()
            ->find();

        $fileReferences = [];
        foreach ($files as $file) {
            $fileReferences[$file->getId()] = $file->getPath();
        }
        $exportPointer->addData($fileReferences, 'file_references.yml');

        foreach ($exportPointer->data as $path => $data) {
            $path = $basePath . $path;
            if (!is_dir(dirname($path))) {
                mkdir(dirname($path), 0770, true);
            }

            $yml = $this->dumpYaml($data);
            $output->writeln(sprintf('write %s', $path));
            file_put_contents($path, $yml);
        }

        $output->writeln(sprintf('Done.'));
    }

    /**
     * @param string $data
     * @return string
     */
    protected function dumpYaml($data)
    {
        $dumper = new Dumper();

        if (defined('Symfony\Component\Yaml\Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK')) {
            return $dumper->dump($data, 15, 2, Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK);
        } else {
            return $dumper->dump($data, 15);
        }
    }

    protected function exportNode($position, Domain $domain, Node $node, ExportPointer $exportPointer)
    {
        $data = $node->toArray(TableMap::TYPE_CAMELNAME);

        if (!$node->getUrn()) {
            return;
        }

        $path = $node->getUrn();
        $exportPointer->pushPath($path);

        if ($node->getId() === $domain->getStartnodeId()) {
            $domain->setVirtualColumn('startnodePath', $path);
        }

        $nodeData=  $this->clearData(
            $data,
            ['id', 'lft', 'rgt', 'lvl', 'pid', 'urn', 'domainId'],
            ['type' => 0, 'layout' => 'default', 'visible' => true]
        );
        $nodeData['sort'] = $position;

        $contents = $node->getContents();
        $contentsData = [];
        foreach ($contents as $content) {
            $contentData = $content->toArray(TableMap::TYPE_CAMELNAME);

            $jsonDecoded = json_decode($contentData['content'], true);
            if (JSON_ERROR_NONE === json_last_error()) {
                $contentData['content'] = $jsonDecoded;
            }

            $contentData = $this->clearData(
                $contentData,
                ['id', 'nodeId'],
                ['template' => 'JarvesBundle:Default:content.html.twig', 'type' => 'text']
            );
            $contentsData[] = $contentData;
        }

        $nodeData['contents'] = $contentsData;
        $exportPointer->addData($nodeData, '.yml');

        foreach ($node->getChildren() as $idx => $child) {
            $this->exportNode($idx, $domain, $child, $exportPointer);
        }

        $exportPointer->popPath();
    }

    protected function clearData($array, $excludeNames = [], $defaults = [])
    {
        foreach ($defaults as $k => $v) {
            if ($array[$k] === $v) {
                unset($array[$k]);
            }
        }
        foreach ($excludeNames as $name) {
            unset($array[$name]);
        }

        foreach ($array as $k => $v) {
            if (null === $v) {
                unset($array[$k]);
            }
        }

        return $array;
    }
}


class ExportPointer
{
    public $path = [];

    public $data = [];

    public $lastData;

    public function pushPath($path)
    {
        $this->path [] = $path;
    }

    public function popPath()
    {
        array_pop($this->path);
    }

    public function getCurrentPath()
    {
        return implode('/', $this->path);
    }

    public function hasPath($path)
    {
        return isset($this->data[$path]);
    }

    public function addData($data, $path = '')
    {
        $path = $this->getCurrentPath() . $path;

        $this->data[$path] = $data;
    }

    public function getLast()
    {
        return end($this->data);
    }

    public function getCurrentData()
    {
        return isset($this->data[$this->getCurrentPath()]) ? $this->data[$this->getCurrentPath()] : null;
    }
}