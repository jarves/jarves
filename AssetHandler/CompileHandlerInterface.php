<?php

namespace Jarves\AssetHandler;

interface CompileHandlerInterface
{
    /**
     * Compiles a file path to an AssetInfo object.
     *
     * Use $this->resolvePath or $this->resolvePublicPath from AbstractHandler to resolve
     * $assetPath.
     *
     * @param string $assetPath might be a symfony path with @ (e.g. @JarvesDemoTheme/base.css.scss)
     * @return AssetInfo
     */
    public function compileFile($assetPath);
}