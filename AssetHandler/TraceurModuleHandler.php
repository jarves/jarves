<?php

namespace Jarves\AssetHandler;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\ProcessBuilder;

class TraceurModuleHandler extends JsHandler implements CompileHandlerInterface
{
    public function compileFile(AssetInfo $assetInfo)
    {
//        $request = $this->jarves->getRequest();
//        $baseUrlAsset = new AssetInfo();
//        $baseUrlAsset->setContentType('text/javascript');
//        $baseUrlAsset->setPriority(500);
//        $baseUrlAsset->setContent('System.baseURL = ' . json_encode($request->getBasePath() . '/').';');

        $traceurAsset = new AssetInfo();
        $traceurAsset->setPath('@JarvesBundle/libraries/traceur-runtime.js');
        $traceurAsset->setPriority(2000);

        return [$assetInfo, $traceurAsset];
    }

    protected function compileFiles($files, $output)
    {
        $root = $webDir = realpath($this->jarves->getKernel()->getRootDir().'/../') . '/';
        $web = $root . '/web';

        chdir($web);
        $traceur = 'traceur'; //todo, make configurable

        $args = array(
            $traceur,
            '--out=traceur_compiled.js',
            '--source-maps',
            '--experimental'
            );

        $md5 = [];
        foreach ($files as $file) {
            $args[] = $file;
            $md5[] = filemtime($file);
        }
        $md5 = md5(implode('.', $md5));


        $needsCompilation = false;

        if (file_exists($output)) {
            $fh = fopen($output, 'r+');
            if ($fh) {
                fseek($fh, -32, SEEK_END);
                $lastLine = fgets($fh);
                $needsCompilation = $lastLine !== $md5;
                fclose($fh);
            }
        }

        if ($needsCompilation) {
            $builder = new ProcessBuilder($args);
            $process = $builder->getProcess();
            $process->run();

            while ($process->isRunning()) {
                // waiting for process to finish
            }

//
//            var_dump($process->getCommandLine());
//            var_dump($process->isSuccessful());
//            var_dump($process->getErrorOutput());
//            var_dump($process->getOutput());
//
//            var_dump($output);
//            var_dump($files);
//            exit;

            if ($process->isSuccessful()) {
                $this->jarves->getWebFileSystem()->move('traceur_compiled.js', $output);
                $mapName = explode('.', $output);
                array_pop($mapName);
                $mapName[] = 'map';
                $mapName = implode('.', $mapName);
                $contents = file_get_contents($output);
                if (file_exists('traceur_compiled.map')) {
                    $this->jarves->getWebFileSystem()->move('traceur_compiled.map', $mapName);
                    $contents = str_replace(
                        '//# sourceMappingURL=traceur_compiled.map',
                        '//# sourceMappingURL=' . basename($mapName),
                        $contents
                    );
                }
                $contents .= "//compile-md5: $md5";
                file_put_contents($output, $contents);
            } else {
                chdir($root);
                throw new \Exception('Traceur Compile failed: ' . $process->getErrorOutput());
            }
        }
        chdir($root);
    }

    public function needsGrouping() {
        return false;
    }

    public function getTags(array $assetsInfo = array(), $concatenation = false)
    {
        $fileName = 'compiled.js';
        $path = 'cache/traceur/' . $fileName;

        $paths = [];
        foreach ($assetsInfo as $assetInfo) {
            $paths[] = $this->getPublicAssetPath($assetInfo->getPath());
        }

        $this->compileFiles($paths, $path);

        return sprintf(
            '<script type="text/javascript" src="%s"></script>',
            $path
        );
    }

    protected function getTag(AssetInfo $assetInfo)
    {
        if ($assetInfo->getPath()) {
            $path = $this->getAssetPath($assetInfo->getPath());
            $pubPath = $this->getPublicAssetPath($assetInfo->getPath());
            if (file_exists($path)) {
                $pubPath .= '?c=' . substr(md5(filemtime($path)),0, 6);
            }
            return sprintf(
                '<script type="module" src="%s"></script>',
                $pubPath
            );
        } else {
            return sprintf(
                <<<EOF
<script type="module">
%s
</script>
EOF
                ,
                $assetInfo->getContent()
            );
        }
    }

}