<?php

namespace Jarves\Twig;

use Jarves\Jarves;
use Propel\Runtime\Map\TableMap;

class BreadcrumbExtension extends \Twig_Extension
{
    /**
     * @var Jarves
     */
    protected $jarves;

    function __construct(Jarves $jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return \Jarves\Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    public function getName()
    {
        return 'breadcrumb';
    }

    public function getFunctions()
    {
        return array(
            'breadcrumb' => new \Twig_Function_Method($this, 'breadcrumb', [
                    'is_safe' => ['html']
                ])
        );
    }

    public function breadcrumb($view = 'JarvesBundle:Default/breadcrumb.html.twig')
    {
        $breadcrumbs = [];
        $page = $this->getJarves()->getCurrentPage();

        $cacheKey = 'core/breadcrumbs/' . $page->getId();
        if ($cache = $this->getJarves()->getDistributedCache($cacheKey)) {
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
            'domain' => $this->getJarves()->getCurrentDomain(),
            'baseUrl' => $this->getJarves()->getPageResponse()->getBaseHref(),
            'breadcrumbs' => $breadcrumbs,
            'currentPage' => $this->getJarves()->getCurrentPage()
        ];

        $html = $this->getJarves()->getTemplating()->render($view, $data);
        $this->getJarves()->setDistributedCache($cacheKey, $html);
        return $html;
    }

}