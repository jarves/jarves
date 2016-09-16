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
    protected $filesystem;

    /**
     * CssHandler constructor.
     * @param Jarves $jarves
     * @param Filesystem $filesystem
     */
    public function __construct(Jarves $jarves, Filesystem $filesystem)
    {
        parent::__construct($jarves);
        $this->filesystem = $filesystem;
    }

    public function compileFile(AssetInfo $assetInfo)
    {
        $assetPath = $assetInfo->getPath();
        $localPath = $this->getAssetPath($assetPath);
        if (!file_exists($localPath)) {
            return null;
        }

        $publicPath = $this->getPublicAssetPath($assetPath);

        $targetPath = 'cache/scss/' . substr($publicPath, 0, strrpos($publicPath, '.'));
        if ('.css' !== substr($targetPath, -4)) {
            $targetPath .= '.css';
        }

        $needsCompilation = true;
        $sourceMTime = filemtime($localPath);
        $dir = dirname($localPath);

        if ($this->filesystem->has('web/' . $targetPath)) {
            $fh = $this->filesystem->handle('web/' . $targetPath);
            if ($fh) {
                $firstLine = fgets($fh);
                $info = substr($firstLine, strlen('/* compiled at '), -3);
                $spacePosition = strpos($info, ' ');
                $lastSourceMTime = 0;
                $dependencies = [];

                if ($spacePosition > 0) {
                    $lastSourceMTime = (int)substr($info, 0, $spacePosition);
                    $dependencies = trim(substr($info, $spacePosition + 1));
                    if ($dependencies) {
                        $dependencies = explode(',', trim(substr($info, $spacePosition + 1)));
                    } else {
                        $dependencies = [];
                    }
                } else {
                    //old format without dependencies
                    $lastSourceMTime = (int)$info;
                }

                $needsCompilation = $lastSourceMTime !== $sourceMTime;

                if (!$needsCompilation) {
                    //check dependencies
                    foreach ($dependencies as $dependency) {
                        list($path, $depLastMTime) = explode(':', $dependency);
                        $depLastMTime = (int)$depLastMTime;

                        if (!file_exists($dir . '/' . $path)) {
                            //depended file does not exist anymore, so we need to recompile
                            $needsCompilation = true;
                            break;
                        }

                        $depSourceMTime = filemtime($dir . '/' . $path);

                        if ($depLastMTime !== $depSourceMTime) {
                            $needsCompilation = true;
                            break;
                        }
                    }
                }

            }
        }

        if ($needsCompilation) {
            //resolve all dependencies
            $dependencies = [];
            $this->resolveDependencies($localPath, $dependencies);

            $processBuilder = new ProcessBuilder();
            $processBuilder
                ->setInput(file_get_contents($localPath))
                ->add('sass')
                ->add('--scss')
                ->add('--no-cache')
                ->add('--unix-newlines')
                ->add('--load-path')
                ->add(dirname($localPath))
                ->add($localPath)
                ->enableOutput();

            $process = $processBuilder->getProcess();
            $process->start();
            while ($process->isRunning()) ;

            if (127 === $process->getExitCode()) {
                throw new \RuntimeException('sass binary not found. Please install sass first and make its in $PATH. '
                    . $process->getExitCodeText());
            }

            if (0 !== $process->getExitCode()) {
                throw new \RuntimeException(sprintf(
                    "Error during scss compilation of %s:\n%s\n%s\n%s",
                    $assetPath,
                    $process->getExitCodeText(),
                    $process->getErrorOutput(),
                    $process->getOutput()
                ));
            }

            $compiled = $process->getOutput();
            $compiled = $this->replaceRelativePaths($publicPath, $targetPath, $compiled);

            $dependencies = implode(',', $dependencies);
            $info = "$sourceMTime $dependencies";
            $compiled = "/* compiled at $info */\n" . $compiled;
            $this->filesystem->write('web/' . $targetPath, $compiled);
        }

        $assetInfo = new AssetInfo();
        $assetInfo->setPath($targetPath);
        $assetInfo->setContentType('text/css');
        return $assetInfo;
    }

    public function resolveDependencies($localPath, array &$dependencies, &$seen = [], $relativeTo = null)
    {
        $localPath = realpath($localPath);
        $content = file_get_contents($localPath);
        $found = [];

        preg_match_all('/@import \'(?!.*:\/\/)([^\/].*)\'/', $content, $matches);
        $found = array_merge($found, $matches[1]);
        preg_match_all('/@import "(?!.*:\/\/)([^\/].*)"/', $content, $matches);
        $found = array_merge($found, $matches[1]);

        foreach ($found as $name) {
            if ('.scss' !== substr($name, -5)) {
                $name .= '.scss';
            }
            $path = dirname($localPath) . '/' . $name;
            if (isset($seen[$path])) {
                continue;
            }
            $seen[$path] = true;

            if (file_exists($path)) {
                $dependencies[] = Tools::getRelativePath($path, dirname($relativeTo ?: $localPath)) . ':' . filemtime($path);

                $this->resolveDependencies($path, $dependencies, $seen, $localPath);
            }
        }
    }

    public function needsGrouping()
    {
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