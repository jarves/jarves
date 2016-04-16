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

namespace Jarves;

use Jarves\Cache\Cacher;
use Jarves\Model\NodeQuery;
use Symfony\Component\Templating\EngineInterface;

class Navigation
{
    /**
     * @var Jarves
     */
    protected $jarves;

    /**
     * @var Cacher
     */
    private $cacher;
    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * Navigation constructor.
     * @param Jarves $jarves
     * @param Cacher $cacher
     * @param PageStack $pageStack
     */
    function __construct(Jarves $jarves, Cacher $cacher, PageStack $pageStack)
    {
        $this->jarves = $jarves;
        $this->cacher = $cacher;
        $this->pageStack = $pageStack;
    }


    public function arrayLevel($array, $level)
    {
        return $array[$level - 1];
    }

    /**
     * 
     * Options:
     * 
     *  //whether the template cache is deactivated. Navigation object is still cached
     *  boolean noCache = false
     *
     *  //whether the pathInfo is used in the cacheKey instead of the currentUrl.
     *  //Useful when you have in your navigation controller calls that are based on pathInfo like
     *  //pageStack->getCurrentUrlAffix()
     *  boolean pathInfoCache = false
     * 
     * Example:
     *   getRendered(['noCache' => true]);
     * 
     * @param array $options
     * @param \Twig_Environment $twig
     * @return string
     * @throws \Exception
     */
    public function getRendered($options, \Twig_Environment $twig)
    {
        $options['noCache'] = isset($options['noCache']) ? (boolean)$options['noCache'] : false;
        $options['pathInfoCache'] = isset($options['pathInfoCache']) ? (boolean)$options['pathInfoCache'] : false;

        $view = $options['template'] ?: $options['view'];
        $cacheKey =
            'core/navigation/'
            . $this->pageStack->getCurrentPage()->getDomainId()
            . '.'
            . $this->pageStack->getCurrentPage()->getId()
            . ($options['pathInfoCache'] ? '_' . md5($this->pageStack->getRequest()->getPathInfo()) : '')
            . '_'
            . md5(json_encode($options));

        $fromCache = false;

        $viewPath = $this->jarves->resolvePath($view, 'Resources/views/');
        if ('@' === $view[0]) {
            $view = substr($view, 1);
        }

        if (!file_exists($viewPath)) {
            throw new \Exception(sprintf('View `%s` not found.', $view));
        } else {
            $mtime = filemtime($viewPath);
        }

        if (!$options['noCache']) {
            $cache = $this->cacher->getDistributedCache($cacheKey);
            if ($cache && isset($cache['html']) && $cache['html'] !== null && $cache['mtime'] == $mtime) {
                return $cache['html'];
            }
        }

        $cache = $this->cacher->getDistributedCache($cacheKey);

        if ($cache && isset($cache['object']) && $cache['mtime'] == $mtime) {
            $navigation = unserialize($cache['object']);
            $fromCache = true;
        } else {
            $navigation = $this->get($options);
        }

        $data['navigation'] = $navigation ?: false;

        if ($navigation !== false) {
            $html = $twig->render($view, $data);

            if (!$options['noCache']) {
                $this->cacher->setDistributedCache($cacheKey, array('mtime' => $mtime, 'html' => $html));
            } elseif (!$fromCache) {
                $this->cacher->setDistributedCache($cacheKey, array('mtime' => $mtime, 'object' => serialize($navigation)));
            }

            return $html;
        }

        //no navigation found, probably the template just uses the breadcrumb
        return $twig->render($view, $data);
    }

    /**
     * @param array $options
     *
     * @return null|Model\Node
     *
     * @throws Exceptions\BundleNotFoundException
     * @throws \Exception
     */
    public function get($options)
    {
        $options['id'] = isset($options['id']) ? $options['id'] : false;
        $options['level'] = isset($options['level']) ? $options['level'] : false;

//        $withFolders = (isset($options['folders']) && $options['folders'] == 1) ? true : false;

        $navigation = false;

        if (!$navigation && $options['id'] != 'breadcrumb' && ($options['id'] || $options['level'])) {

            if ($options['id'] + 0 > 0) {
                $navigation = $this->pageStack->getPage($options['id'] + 0);

                if (!$navigation) {
                    return null;
                }
            }

            if ($options['level'] > 1) {

                $currentPage = $this->pageStack->getCurrentPage();
                $parents = $currentPage->getParents();
                $parents[] = $currentPage;

                $currentLevel = count($parents) + 1;
                $page = $this->arrayLevel($parents, $options['level']);

                if ($page && $page->getId() > 0) {
                    $navigation = $this->pageStack->getPage($page->getId());
                } elseif ($options['level'] == $currentLevel + 1) {
                    $navigation = $this->pageStack->getCurrentPage();
                }
            }

            if ($options['level'] == 1) {
                $navigation = NodeQuery::create()
                    ->findRoot($this->pageStack->getCurrentDomain()->getId());
            }
        }

        return $navigation;
    }

}
