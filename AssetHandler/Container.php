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
        if ($serviceId = @$this->handlerByExtension[strtolower($extension)]) {
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
     * @param string $filePath
     * @return LoaderHandlerInterface
     */
    public function getLoaderHandlerByExtension($filePath)
    {
        $exploded = explode('.', $filePath);
        $extension = array_pop($exploded);

        if ($serviceId = @$this->loaderByExtension[strtolower($extension)]) {
            return $this->container->get($serviceId);
        }
    }

}