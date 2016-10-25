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

use Doctrine\Common\Util\Debug;
use Jarves\Model\Content;
use Jarves\Model\Domain;
use Jarves\Model\DomainQuery;
use Jarves\Model\File;
use Jarves\Model\FileQuery;
use Jarves\Model\Node;
use Jarves\Model\NodeQuery;
use Jarves\Storage\AbstractStorage;
use Propel\Runtime\ActiveQuery\Criteria;
use Propel\Runtime\Collection\ObjectCollection;
use Propel\Runtime\Map\TableMap;
use Propel\Runtime\Propel;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Finder\Finder;
use Symfony\Component\Finder\SplFileInfo;
use Symfony\Component\Yaml\Dumper;
use Symfony\Component\Yaml\Parser;

class ContentImportCommand extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:content:import')
            ->addOption('watch', null, InputOption::VALUE_NONE, "Watches for file changes and reimports")
            ->setDescription('Imports website data from the package in app/jarves');
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
        $basePath = 'app/jarves/';
        $fs = new Filesystem();
        if (!$fs->exists($basePath)) {
            $output->writeln(sprintf('<error>No website data in %s</error>', $basePath));
            return;
        }

        $files = $this->import($input, $output);

        if (!$input->getOption('watch')) {
            $output->writeln("<info>Done.</info>");
        } else {
            do {
                $output->writeln("<info>Done. Wait for changes ...</info>");

                while (true) {
                    sleep(1);
                    clearstatcache();
                    foreach ($files as $path => $mtime) {
                        if ($mtime !== filemtime($path)) {
                            $output->writeln(sprintf("<info>%s changed. Reimport</info>", $path));
                            break 2;
                        }
                    }
                }

                try {
                    $files = $this->import($input, $output);
                } catch (\Exception $e) {
                    foreach ($files as $path => $mtime) {
                        $files[$path] = filemtime($path);
                    }

                    $output->writeln("<error>Failed</error>");
                    echo Debug::toString($e);
                    $output->writeln("<info>Waiting for changes ...</info>");
                }

            } while(true);
        }

    }

    protected function import(InputInterface $input, OutputInterface $output)
    {
        $basePath = 'app/jarves/';
        $openedFiles = [];

        $domains = [];
        $nodes = [];
        $rootNodes = [];

        $ymlParser = new Parser();
        Propel::getWriteConnection('default')->beginTransaction();

        //import files
        $fileReferencesPath = $basePath . '/file_references.yml';
        if (file_exists($fileReferencesPath)) {
            $openedFiles[$fileReferencesPath] = filemtime($fileReferencesPath);
            $fileReferences = $ymlParser->parse(file_get_contents($fileReferencesPath));

            $output->writeln(sprintf('Import %d file references ...', count($fileReferences)));
            FileQuery::create()
                ->deleteAll();

            foreach ($fileReferences as $id => $path) {
                $file = new File();
                $file->setId($id);
                $file->setPath($path);
                $file->save();
            }
        }

        $relativePathBase = $basePath . 'website/';

        $dir = opendir($relativePathBase);
        while ($domainName = readdir($dir)) {
            if ('.' === $domainName
                || '..' === $domainName
                || '.yml' === substr($domainName, -4)
            ) {
                continue;
            }

            $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($basePath . 'website/' . $domainName));
            $files = iterator_to_array($files);
            ksort($files);

            $output->writeln(sprintf('Import domain %s ...', $domainName));

            $domain = DomainQuery::create()
                ->findOneByDomain($domainName);
            if (!$domain) {
                $domain = new Domain();
            }

            $ymlPath = $relativePathBase . $domainName . '.yml';
            $domainFromYml = $ymlParser->parse(file_get_contents($ymlPath));
            $openedFiles[$ymlPath] = filemtime($ymlPath);

            $oldData = $domain->toArray(TableMap::TYPE_CAMELNAME);
            $domain->fromArray(array_merge($oldData, $domainFromYml), TableMap::TYPE_CAMELNAME);
            $domain->setStartnodeId(null);

            if (isset($domainFromYml['startnode'])) {
                $domain->setVirtualColumn('startnodePath', $domainFromYml['startnode']);
            }
            $domain->save();
            $domains[$domainName] = $domain;

            NodeQuery::create()
                ->filterByDomain($domain)
                ->delete();

            $rootNode = new Node();
            $rootNode->setTitle('root');
            $rootNode->makeRoot();
            $rootNode->setDomain($domain);
            $rootNode->save();
            $rootNodes[$domainName] = $rootNode;

            $nodes[''] = $rootNode;

            $parentNodeQueue = [];

            /** @var \SplFileInfo $file */
            foreach ($files as $file) {
                if ('.' === $file->getFilename()
                    || '..' === $file->getFilename()
                    || '.yml' !== substr($file->getFilename(), -4)
                ) {
                    continue;
                }

                $path = $file->getPath() . '/' . $file->getFilename();
                $path = substr($path, strlen($relativePathBase . $domainName) + 1);
                if (!$path) {
                    continue;
                }

                $parentPath = '';
                if (false !== strpos($path, '/')) {
                    $parentPath = dirname($path);
                }
                $baseName = substr(basename($path), 0, -4); //without .yml

                if ($baseName) {
                    //its a node
                    $node = isset($nodes[$path]) ? $nodes[$path] : new Node();

                    $ymlPath = $relativePathBase . $domainName . '/' . $path;
                    $nodeFromYml = $ymlParser->parse(file_get_contents($ymlPath));
                    $openedFiles[$ymlPath] = filemtime($ymlPath);

                    $node->fromArray($nodeFromYml, TableMap::TYPE_CAMELNAME);
                    $node->setDomain($domain);
                    $urn = $baseName;

                    if (false !== $dotPos = strpos($baseName, '.')) {
                        $prefix = substr($baseName, 0, $dotPos);
                        if ($prefix) {
                            $urn = substr($baseName, $dotPos + 1);
                        }
                    }

                    $node->setUrn($urn);
                    $output->writeln(sprintf('Import page %s%s ...', str_repeat('  ', substr_count($path, '/')), $node->getTitle()));

                    $nodes[substr($path, 0, -4)] = $node;

                    $end = isset($parentNodeQueue[$parentPath]) ? count($parentNodeQueue[$parentPath]) : 1;
                    $position = isset($nodeFromYml['sort']) ? $nodeFromYml['sort'] : $end;
                    $parentNodeQueue[$parentPath][$position][] = $node;

                    if (isset($nodeFromYml['contents'])) {
                        foreach ($nodeFromYml['contents'] as $idx => $contentFromYaml) {
                            if (isset($contentFromYaml['content']) && is_array($contentFromYaml['content'])) {
                                $contentFromYaml['content'] = json_encode($contentFromYaml['content']);
                            }

                            $content = new Content();
                            $content->setSort($idx);
                            $content->fromArray($contentFromYaml, TableMap::TYPE_CAMELNAME);
                            $content->setNode($node);
                        }

                        if ($domain->hasVirtualColumn('startnodePath') && substr($path, 0, -4) === $domain->getVirtualColumn('startnodePath')) {
                            $domain->setStartnode($node);
                        }
                    }
                }
            }

            //save queued nodes
            foreach ($parentNodeQueue as $parentPath => $nodesQueue) {
                ksort($nodesQueue); //key is sort

                /** @var Node $node */
                foreach ($nodesQueue as $position => $nodesToInsert) {
                    foreach ($nodesToInsert as $node) {
                        $node->insertAsLastChildOf($nodes[$parentPath]);
                        $node->save(); //saves Content as well.
                    }
                }
            }
            $domain->save();

        }

        Propel::getWriteConnection('default')->commit();

        $cacher = $this->getContainer()->get('jarves.cache.cacher');
        $cacher->invalidateCache('core');

        return $openedFiles;
    }
}