<?php

namespace Jarves;

use Jarves\Cache\Cacher;
use Jarves\Cache\ResponseCacher;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

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
            if (!isset($values[$key]) || !$values[$key]) {
                $values[$key] = $default;
            }
        }
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
        /** @var Cacher $cacher */
        $cacher = $this->container->get('jarves.cache.cacher');
        return $cacher->getDistributedCache($cacheKey) !== null;
    }

    /**
     * Returns a rendered view. If we find data behind the given cache
     * it uses this data instead of calling $data. So this function
     * does not cache the whole rendered html. To do so use renderFullCache().
     *
     * In this cache method, the template engine is always called. If you want to cache
     * this as well, use renderFullCached().
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
        /** @var ResponseCacher $responseCacher */
        $responseCacher = $this->container->get('jarves.cache.response_cacher');
        
        return $responseCacher->renderCached($cacheKey, $view, $data);
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
        /** @var ResponseCacher $responseCacher */
        $responseCacher = $this->container->get('jarves.cache.response_cacher');
        
        return $responseCacher->renderFullCached($cacheKey, $view, $data, $lifeTime, $force);
    }
}