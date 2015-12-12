<?php

namespace Jarves\AssetHandler;

use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\DependencyInjection\Reference;

class Container
{
    /**
     * @var CompileHandlerInterface[]
     */
    protected $handlerByExtension;

    /**
     * @var CompileHandlerInterface[]
     */
    protected $handlerByType;

    /**
     * @var LoaderHandlerInterface[]
     */
    protected $loaderByContentType;

    /**
     * @var LoaderHandlerInterface[]
     */
    protected $loaderByExtension;

    /**
     * @var ContainerInterface
     */
    protected $container;

    function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    /**
     * @param string $fileExtension
     * @param string $serviceId
     */
    public function registerCompileHandlerByExtension($fileExtension, $serviceId)
    {
        $this->handlerByExtension[strtolower($fileExtension)] = $serviceId;
    }


    /**
     * @param string $fileExtension
     * @param string $serviceId
     */
    public function registerCompileHandlerByContentType($contentType, $serviceId)
    {
        $this->handlerByType[strtolower($contentType)] = $serviceId;
    }

    /**
     * @param string $contentType
     * @param string $serviceId
     */
    public function registerLoaderHandlerByContentType($contentType, $serviceId)
    {
        $this->loaderByContentType[strtolower($contentType)] = $serviceId;
    }

    /**
     * @param string $fileExtension
     * @param string $serviceId
     */
    public function registerLoaderHandlerByExtension($fileExtension, $serviceId)
    {
        $this->loaderByExtension[strtolower($fileExtension)] = $serviceId;
    }

    /**
     * @param string $filePath
     * @return CompileHandlerInterface
     */
    public function getCompileHandlerByFileExtension($filePath)
    {
        $exploded = explode('.', $filePath);
        $extension = array_pop($exploded);
        $extensionLong = array_pop($exploded) . '.' . $extension;

        if ($serviceId = @$this->handlerByExtension[strtolower($extensionLong)]) {
            return $this->container->get($serviceId);
        }
        if ($serviceId = @$this->handlerByExtension[strtolower($extension)]) {
            return $this->container->get($serviceId);
        }
    }

    /**
     * @param string $type
     * @return CompileHandlerInterface
     */
    public function getCompileHandlerByContentType($type)
    {
        if ($serviceId = @$this->handlerByType[strtolower($type)]) {
            return $this->container->get($serviceId);
        }
    }

    /**
     * @param string $contentType
     * @return LoaderHandlerInterface
     */
    public function getLoaderHandlerByContentType($contentType)
    {
        if ($serviceId = @$this->loaderByContentType[strtolower($contentType)]) {
            return $this->container->get($serviceId);
        }
    }

    /**
     * @param AssetInfo $assetInfo
     *
     * @return AssetInfo[]
     */
    public function compileAsset(AssetInfo $assetInfo)
    {
        $compiler = $this->getCompileHandlerByContentType($assetInfo->getContentType());
        if (!$compiler) {
            $compiler = $this->getCompileHandlerByFileExtension($assetInfo->getPath());
        }

        if (!$compiler) {
            return [$assetInfo]; //no compiler found, so ok
        }

        if ($compiledAssetInfoResult = $compiler->compileFile($assetInfo)) {
            if (is_array($compiledAssetInfoResult)) {
                return $compiledAssetInfoResult;
            } else {
                if ($compiledAssetInfoResult instanceof AssetInfo) {
                   return [$compiledAssetInfoResult];
                }
            }
        }
        return [];
    }

    /**
     * @param string $filePath
     * @return LoaderHandlerInterface
     */
    public function getLoaderHandlerByExtension($filePath)
    {
        $exploded = explode('.', $filePath);
        $extension = array_pop($exploded);
        $extensionLong = array_pop($exploded) . '.' . $extension;

        if ($serviceId = @$this->loaderByExtension[strtolower($extensionLong)]) {
            return $this->container->get($serviceId);
        }
        if ($serviceId = @$this->loaderByExtension[strtolower($extension)]) {
            return $this->container->get($serviceId);
        }
    }

}