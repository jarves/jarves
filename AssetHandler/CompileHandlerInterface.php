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
     * @return AssetInfo|null|true null to remove the file from asset list, true to let the asset it the list and dont change anything
     *                             or a new AssetInfo object if the old should be replaced with this one.
     */
    public function compileFile($assetPath);
}