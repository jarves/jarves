<?php

namespace Jarves\Twig;

use Jarves\Cache\Cacher;
use Jarves\Jarves;
use Jarves\PageStack;
use Propel\Runtime\Map\TableMap;
use Symfony\Component\Templating\EngineInterface;

class BreadcrumbExtension extends \Twig_Extension
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var Cacher
     */
    private $cacher;

    /**
     * @param Jarves $jarves
     * @param PageStack $pageStack
     * @param Cacher $cacher
     */
    function __construct(Jarves $jarves, PageStack $pageStack, Cacher $cacher)
    {
        $this->jarves = $jarves;
        $this->pageStack = $pageStack;
        $this->cacher = $cacher;
    }

    public function getName()
    {
        return 'breadcrumb';
    }

    public function getFunctions()
    {
        return array(
            'breadcrumb' => new \Twig_Function_Method($this, 'breadcrumb', [
                'is_safe' => ['html'],
                'needs_environment' => true
            ])
        );
    }

    public function breadcrumb(\Twig_Environment $twig, $view = 'JarvesBundle:Default/breadcrumb.html.twig')
    {
        $breadcrumbs = [];
        $page = $this->pageStack->getCurrentPage();

        $cacheKey = 'core/breadcrumbs/' . $page->getId();
        if ($cache = $this->cacher->getDistributedCache($cacheKey)) {
            if (is_string($cache)) {
                return $cache;
            }
        }

        foreach ($page->getParents() as $parent) {
            if ($parent->getType() >= 2) {
                continue;
            }
            $breadcrumbs[] = $parent;
        }

        $data = [
            'domain' => $this->pageStack->getCurrentDomain(),
            'baseUrl' => $this->pageStack->getPageResponse()->getBaseHref(),
            'breadcrumbs' => $breadcrumbs,
            'currentPage' => $this->pageStack->getCurrentPage()
        ];

        $html = $twig->render($view, $data);
        $this->cacher->setDistributedCache($cacheKey, $html);
        return $html;
    }

}