<?php

namespace Jarves\AssetHandler;

use Jarves\Tools;

class ScssHandler extends AbstractHandler implements CompileHandlerInterface
{
    public function compileFile(AssetInfo $assetInfo)
    {
        $assetPath = $assetInfo->getPath();
        $localPath = $this->getAssetPath($assetPath);
        if (!file_exists($localPath)){
            return null;
        }

        $publicPath = $this->getPublicAssetPath($assetPath);

        $targetPath = 'cache/scss/' . substr($publicPath, 0, strrpos($publicPath, '.'));
        if ('.css' !== substr($targetPath, -4)) {
            $targetPath .= '.css';
        }

        $needsCompilation = true;
        $sourceMTime = filemtime($localPath);

        if (file_exists('web/' . $targetPath)) {
            $fh = fopen('web/' . $targetPath, 'r+');
            if ($fh) {
                $firstLine = fgets($fh);
                $lastSourceMTime = (int) substr($firstLine, strlen('/* compiled at '), -3);

                $needsCompilation = $lastSourceMTime !== $sourceMTime;
            }
        }

        if ($needsCompilation) {
            $options = [
            ];

//            $localPath = realpath($localPath);
            $compiler = new \Leafo\ScssPhp\Compiler();
            $compiler->setImportPaths(dirname($localPath));

            $compiled = $compiler->compile(file_get_contents($localPath), $localPath);

//            $compiled = $this->replaceRelativePaths($publicPath, $targetPath, $compiled);
            $compiled = "/* compiled at $sourceMTime */\n".$compiled;
            $this->getJarves()->getWebFileSystem()->write($targetPath, $compiled);
        }

        $assetInfo = new AssetInfo();
        $assetInfo->setPath($targetPath);
        $assetInfo->setContentType('text/css');
        return $assetInfo;
    }

    public function needsGrouping() {
        return false;
    }

    /**
     * @param string $from scss path
     * @param string $to css path
     * @param string $content
     * @return string
     */
    protected function replaceRelativePaths($from, $to, $content)
    {
        $relative = Tools::getRelativePath(dirname($from), dirname($to)) . '/';

        $content = preg_replace('/@import \'(?!.*:\/\/)([^\/].*)\'/', '@import \'' . $relative . '$1\'', $content);
        $content = preg_replace('/@import "(?!.*:\/\/)([^\/].*)"/', '@import "' . $relative . '$1"', $content);
        $content = preg_replace('/url\(\'(?!.*:\/\/)([^\/][^\)]*)\'\)/', 'url(\'' . $relative . '$1\')', $content);
        $content = preg_replace('/url\(\"(?!.*:\/\/)([^\/][^\)]*)\"\)/', 'url(\"' . $relative . '$1\")', $content);
        $content = preg_replace('/url\((?!.*data:image)(?!.*:\/\/)([^\/\'].*)\)/', 'url(' . $relative . '$1)', $content);

        return $content;
    }
}