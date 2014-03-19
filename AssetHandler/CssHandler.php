<?php

namespace Jarves\AssetHandler;

class CssHandler extends AbstractHandler implements LoaderHandlerInterface
{
    protected function getTag(AssetInfo $assetInfo)
    {
        if ($assetInfo->getFile()) {
            $path = $this->getAssetPath($assetInfo->getFile());
            $pubPath = $this->getPublicAssetPath($assetInfo->getFile());
            if (file_exists($path)) {
                $pubPath .= '?c=' . substr(md5(filemtime($path)),0, 6);
            }
            return sprintf(
                '<link rel="stylesheet" type="text/css" href="%s" >',
                $pubPath
            );
        } else {
            return sprintf(
                <<<EOF
<style type="text/css">
%s
</style>
EOF
                ,
                $assetInfo->getContent()
            );
        }
    }

    /**
     * @param AssetInfo[] $assetsInfo
     * @param bool $concatenation
     * @return string
     */
    public function getTags(array $assetsInfo = array(), $concatenation = false)
    {
        $tags = [];

        if ($concatenation) {
            $filesToCompress = [];

            foreach ($assetsInfo as $asset) {
                if ($asset->getFile()) {
                    // load css files, that are not accessible (means those point to a controller)
                    // because those can't be compressed
                    $localPath = $this->getAssetPath($asset->getFile());
                    if (!file_exists($localPath)) {
                        $tags[] = $this->getTag($asset);
                        continue;
                    }
                }

                if ($asset->getContent()) {
                    // load inline assets because we can't compress those
                    $tags[] = $this->getTag($asset);
                    continue;
                }

                if (!$asset->isCompressionAllowed()) {
                    $tags[] = $this->getTag($asset);
                    continue;
                }

                $filesToCompress[] = $asset->getFile();
            }

            if ($filesToCompress) {
                $tags[] = $this->getTag($this->compressFiles($filesToCompress));
            }
        } else {
            foreach ($assetsInfo as $asset) {
                $tags[] = $this->getTag($asset);
            }
        }

        return implode("\n", $tags);
    }

    /**
     * @param array $files
     *
     * @return AssetInfo
     */
    public function compressFiles(array $files)
    {
        $md5String = '';

        foreach ($files as $file) {
            $path = $this->getAssetPath($file);
            $md5String .= '.' . filemtime($path);
        }

        $fileUpToDate = false;
        $md5Line = '/* ' . md5($md5String) . " */\n";

        $oFile = 'cache/compressed-css/' . md5($md5String) . '.css';
        $handle = @fopen($this->getJarves()->getKernel()->getRootDir() . '/../web/' . $oFile, 'r');
        if ($handle) {
            $line = fgets($handle);
            fclose($handle);
            if ($line == $md5Line) {
                $fileUpToDate = true;
            }
        }

        if (!$fileUpToDate) {
            $content = $this->getJarves()->getUtils()->compressCss(
                $files,
                'cache/compressed-css/'
            );
            $content = $md5Line . $content;
            $this->getJarves()->getWebFileSystem()->write($oFile, $content);
        }

        $assetInfo = new AssetInfo();
        $assetInfo->setFile($oFile);

        return $assetInfo;
    }

}