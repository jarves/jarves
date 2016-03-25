<?php

namespace Jarves\Command;

use Jarves\Jarves;
use Jarves\Model\Base\NodeQuery;
use Jarves\Router\FrontendRouter;
use Propel\Runtime\ActiveQuery\Criteria;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\RouteCollection;

class FrontendCommand extends AbstractCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        parent::configure();
        $this
            ->setName('jarves:frontend')
        ;
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        /** @var Jarves $jarves */
        $jarves = $this->getContainer()->get('jarves');

        $table = new Table($output);
        $table->setStyle('compact');
        $table->setHeaders(['Domain', 'Type', 'Title', 'Method', 'Path', 'Controller']);

        $frontendRouter = new FrontendRouter($jarves, new Request());
        $nodes = NodeQuery::create()
            ->filterByLft(1, Criteria::GREATER_THAN) //exclude root nodes of nested set
            ->orderByDomainId()
            ->orderByLft()
            ->find();

        $typeNames = [
            null => '',
            0 => 'Page',
            1 => 'Link',
            2 => 'Navigation',
            3 => 'Deposit',
        ];

        foreach ($nodes as $node) {

            $routes = new RouteCollection();
            $frontendRouter->setRoutes($routes);
            $frontendRouter->registerMainPage($node);
            $frontendRouter->registerPluginRoutes($node);

            /** @var $route \Symfony\Component\Routing\Route */
            foreach ($routes as $route) {
                $titleSuffix = '';
                if ($route->hasDefault('_title')) {
                    $titleSuffix .= ' (' . $route->getDefault('_title') . ')';
                }

                $table->addRow([
                    $node->getDomain()->getDomain(),
                    $typeNames[$node->getType()],
                    str_repeat('  ', $node->getLvl()) . $node->getTitle(). $titleSuffix,
                    join(',', $route->getMethods()),
                    $node->getType() === 3 ? '' : $route->getPath(),
                    $route->getDefault('_controller')
                ]);
            }
        }

        $table->render();
    }
}
