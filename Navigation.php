<?php

namespace Jarves;

use Jarves\Model\NodeQuery;

class Navigation
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
     * @param Jarves $jarves
     */
    public function setJarves($jarves)
    {
        $this->jarves = $jarves;
    }

    /**
     * @return Jarves
     */
    public function getJarves()
    {
        return $this->jarves;
    }

    public function arrayLevel($array, $level)
    {
        return $array[$level - 2];
    }

    public function get($options)
    {
        $jarves = $this->getJarves();

        $view = $options['template'] ? : $options['view'];
        $options['noCache'] = isset($options['noCache']) ? $options['noCache'] : false;
        $options['id'] = isset($options['id']) ? $options['id'] : false;
        $options['level'] = isset($options['level']) ? $options['level'] : false;

//        $withFolders = (isset($options['folders']) && $options['folders'] == 1) ? true : false;

        $cacheKey = 'core/navigation/' . $jarves->getCurrentPage()->getDomainId() . '.' . $jarves->getCurrentPage()->getId() . '_' . md5(
            json_encode($options)
        );

        $navigation = false;
        $fromCache = false;

        $viewPath = $jarves->resolvePath($view, 'Resources/views/');
        if ('@' === $view[0]) {
            $view = substr($view, 1);
        }

        if (!file_exists($viewPath)) {
            throw new \Exception(sprintf('View `%s` not found.', $view));
        } else {
            $mtime = filemtime($viewPath);
        }

        $themeProperties = $jarves->getCurrentDomain()->getThemeProperties();

        if (!$options['noCache'] && $themeProperties && $themeProperties->getByPath('core/cacheNavigations') !== 0) {

            $cache = $jarves->getDistributedCache($cacheKey);
            if ($cache && isset($cache['html']) && $cache['html'] !== null && $cache['mtime'] == $mtime) {
                return $cache['html'];
            }
        }

        $cache = $jarves->getDistributedCache($cacheKey);

        if ($cache && isset($cache['object']) && $cache['mtime'] == $mtime) {
            $navigation = unserialize($cache['object']);
            $fromCache = true;
        }

        if (!$navigation && $options['id'] != 'breadcrumb' && ($options['id'] || $options['level'])) {

            if ($options['id'] + 0 > 0) {
                $navigation = $this->getJarves()->getUtils()->getPage($options['id'] + 0);

                if (!$navigation) {
                    return null;
                }
            }

            if ($options['level'] > 1) {

                $currentPage = $this->getJarves()->getCurrentPage();
                $parents = $currentPage->getParents();
                $parents[] = $currentPage;

                $currentLevel = count($parents) + 1;
                $page = $this->arrayLevel($parents, $options['level']);

                if ($page && $page->getId() > 0) {
                    $navigation = $this->getJarves()->getUtils()->getPage($page->getId());
                } elseif ($options['level'] == $currentLevel + 1) {
                    $navigation = $jarves->getCurrentPage();
                }
            }

            if ($options['level'] == 1) {
                $navigation = NodeQuery::create()->findRoot($jarves->getCurrentDomain()->getId());
            }
        }

        $data['navigation'] = $navigation ?: false;
        if ($navigation !== false) {

            $html = $jarves->getTemplating()->render($view, $data);

            if (!$options['noCache'] && $themeProperties && $themeProperties->getByPath('core/cacheNavigations') !== 0) {
                $jarves->setDistributedCache($cacheKey, array('mtime' => $mtime, 'html' => $html));
            } elseif (!$fromCache) {
                $jarves->setDistributedCache($cacheKey, array('mtime' => $mtime, 'object' => serialize($navigation)));
            }

            return $html;
        }

        //no navigation found, probably the template just uses the breadcrumb
        return $jarves->getTemplating()->render($view, $data);
    }

}
