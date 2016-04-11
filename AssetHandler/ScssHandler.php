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

namespace Jarves\AssetHandler;

use Jarves\Filesystem\Filesystem;
use Jarves\Jarves;
use Jarves\Tools;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\ProcessBuilder;

class ScssHandler extends AbstractHandler implements CompileHandlerInterface
{
    /**
     * @var Filesystem
     */
    protected $webFilesystem;

    /**
     * CssHandler constructor.
     * @param Jarves $jarves
     * @param Filesystem $webFilesystem
     */
    public function __construct(Jarves $jarves, Filesystem $webFilesystem)
    {
        parent::__construct($jarves);
        $this->webFilesystem = $webFilesystem;
    }

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
            $processBuilder = new ProcessBuilder();
            $processBuilder
                ->setInput(file_get_contents($localPath))
                ->add('sass')
                ->add('--scss')
                ->add('--unix-newlines')
                ->add('--load-path')
                ->add(dirname($localPath))
                ->add($localPath)
                ->enableOutput()
            ;

            $process = $processBuilder->getProcess();
            $process->start();
            while ($process->isRunning());

            if (($error = $process->getErrorOutput()) && false !== strpos($error, 'Error:')) {
                throw new \RuntimeException(sprintf("Error during scss compilation of %s:\n%s", $assetPath, $error));
            }

            $compiled = $process->getOutput();
            $compiled = $this->replaceRelativePaths($publicPath, $targetPath, $compiled);
            $compiled = "/* compiled at $sourceMTime */\n".$compiled;
            $this->webFilesystem->write($targetPath, $compiled);
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