<?php

namespace Jarves;

use Jarves\Exceptions\FileNotFoundException;

class PluginController extends Controller
{

    /**
     * Replaces all falsy (0, '', null) values in $values with the $default value.
     *
     * @param array $values
     * @param array $defaults
     */
    protected function setOptions(array &$values, array $defaults)
    {
        foreach ($defaults as $key => $default) {
            if (!@$values[$key]) {
                $values[$key] = $default;
            }
        }
    }

//    /**
//     * Returns the rendered view output.
//     *
//     * If you've extended your main controller with this controller,
//     * then $pView will be prefixed with the current module key,
//     * so that the views of <moduleKey>/views/ will be loaded primarily.
//     * If the view does not exists there, it tries to load the view from root.
//     *
//     * Depending on the file name of the view we use Smarty, Twig, plain PHP or nothing.
//     *
//     * Examples:
//     *    plugin1/default.php           -> php
//     *    plugin1/default.tpl           -> none
//     *    plugin1/default.html          -> none
//     *    plugin1/default.html.smarty   -> smarty
//     *    plugin1/default.html.twig     -> twig
//     *
//     * @param  string $view
//     * @param  array $data Use this data instead of the data assigned through $this->assign()
//     * @param  bool $translate
//     *
//     * @return string
//     */
//    public function renderView($view, array $data = array(), $translate = true)
//    {
//        $engine = $this->getJarves()->getTemplateEngineForFileName($view);
//f
//        $view = $this->getJarves()->resolvePath($view, 'Resources/views/');
//
//        $html = (string)$engine->render($view, $data ? array_merge($this->viewData, $data) : $this->viewData, $this);
//
//        return $translate ? $this->getJarves()->translate($html) : $html;
//    }

    protected function getViewMTime($view)
    {
        $view = $this->getJarves()->resolvePath($view, 'Resources/views/');

        if (!file_exists($view)) {
            throw new FileNotFoundException(sprintf('File `%s` not found.', $view));
        }

        return filemtime($view);
    }

    /**
     * Returns whether this cache is valid(exists) or not.
     *
     * @param  string $cacheKey
     *
     * @return boolean
     */
    protected function isValidCache($cacheKey)
    {
        return $this->getJarves()->getDistributedCache($cacheKey) !== null;
    }

    /**
     * Returns a rendered view. If we find data behind the given cache
     * it uses this data instead of calling $data. So this function
     * does not cache the whole rendered html. Tho do so use renderFullCache().
     *
     * Example:
     *
     *  return $this->renderCache('myCache', 'plugin1/default.tpl', function(){
     *     return array('items' => heavyDbQuery());
     * });
     *
     * Note: The $data callable is only called if the cache needs to regenerate.
     * If the callable $data returns NULL, then this will return NULL, too.
     *
     * @param string $cacheKey
     * @param string $view
     * @param array|callable $data Pass the data as array or a data provider function.
     *
     * @see method `render` to get more information.
     *
     * @return string
     */
    protected function renderCached($cacheKey, $view, $data = null)
    {
        $cache = $this->getJarves()->getDistributedCache($cacheKey);
        $mTime = $this->getViewMTime($view);

        if (!$cache || !$cache['data'] || !is_array($cache) || $mTime != $cache['fileMTime']) {

            $data2 = $data;
            if (is_callable($data)) {
                $data2 = call_user_func($data, $view);
                if ($data2 === null) {
                    return null;
                }
            }

            $cache = array(
                'data' => $data2,
                'fileMTime' => $mTime
            );

            $this->getJarves()->setDistributedCache($cacheKey, $cache);
        }

        return new PluginResponse($this->renderView($view, $cache['data']));

    }

    /**
     * Returns a rendered view. If we find html behind the given cache
     * it returns this directly. This is a couple os ms faster than `renderCached`
     * since the template engine is never used when there's a valid cache.
     *
     * Example:
     *
     *  return $this->renderFullCached('myCache', 'plugin1/default.tpl', function(){
     *     return array('items' => heavyDbQuery());
     * });
     *
     * Note: The $data callable is only called if the cache needs to regenerate.
     *
     * If the callable $data returns NULL, then this will return NULL, too, without entering
     * the actual rendering process.
     *
     * @param string $cacheKey
     * @param string $view
     * @param array|callable $data Pass the data as array or a data provider function.
     * @param integer $lifeTime In seconds. Default is one hour/3600 seconds.
     * @param bool $force Force to bypass the cache and always call $data. For debuggin purposes.
     *
     * @see method `render` to get more information.
     *
     * @return string
     */
    protected function renderFullCached($cacheKey, $view, $data = null, $lifeTime = null, $force = false)
    {
        $cache = $this->getJarves()->getDistributedCache($cacheKey);
        $mTime = $this->getViewMTime($view);

        if (!is_string($cache)) {
            $cache = null;
        } else {
            $cache = unserialize($cache);
        }

        if ($force || !$cache || !$cache['content'] || !is_array($cache) || $mTime != $cache['fileMTime']) {

            $oldResponse = clone $this->getJarves()->getPageResponse();

            $data2 = $data;
            if (is_callable($data)) {
                $data2 = call_user_func($data, $view);
                if (null === $data2) {
                    //the data callback returned NULL so this means
                    //we aren't the correct controller for this request
                    //or the request contains invalid input
                    return null;
                }
            }

            $content = $this->renderView($view, $data2);
            $response = $this->getJarves()->getPageResponse();
            $diff = $oldResponse->diff($response);

            $cache = array(
                'content' => $content,
                'fileMTime' => $mTime,
                'responseDiff' => $diff
            );

            $this->getJarves()->setDistributedCache($cacheKey, serialize($cache), $lifeTime ?: 3600);

        } else if ($cache['responseDiff']) {
            $this->getJarves()->getPageResponse()->patch($cache['responseDiff']);
        }

        return new PluginResponse($cache['content']);
    }
}