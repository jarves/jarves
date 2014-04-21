<?php

namespace Jarves\Tests\Jarves;

use Jarves\Tests\KernelAwareTestCase;
use Symfony\Component\HttpFoundation\Request;

class PageResponseTest extends KernelAwareTestCase
{
    public function testJsAssets()
    {
        $response = $this->getPageResponse();
        $response->addJsFile('@TestBundle/page-response-test/javascript1.js');
        $response->addJs("var c = 'cde'");
        $response->addJsFile('@TestBundle/page-response-test/javascript2.js');

        $assetsTags = $response->getAssetTags();

        $expected = <<<EOF
<script type="text/javascript" src="bundles/test/page-response-test/javascript1.js\?c=([a-z0-9]{6})"></script>
<script type="text/javascript">
var c = 'cde'
</script>
<script type="text/javascript" src="bundles/test/page-response-test/javascript2.js\?c=([a-z0-9]{6})"></script>
EOF;

        $this->assertRegExp("#$expected#", $assetsTags['jsTags']);
    }

    public function testJsAssetsCompressed()
    {
        $response = $this->getPageResponse();
        $response->addJsFile('@TestBundle/page-response-test/javascript1.js');
        $response->addJs("var c = 'cde'");
        $response->addJsFile('@TestBundle/page-response-test/javascript2.js');
        $response->setResourceCompression(true);

        $assetsTags = $response->getAssetTags();
        $expected = <<<EOF
<script type="text/javascript">
var c = 'cde'
</script>
<script type="text/javascript" src="cache/compressed-js/([a-z0-9]{32}).js\?c=([a-z0-9]{6})"></script>
EOF;

        $this->assertRegExp("#$expected#", $assetsTags['jsTags']);

        preg_match('#([a-z0-9]{32}).js#', $assetsTags['jsTags'], $matches);
        $compressedFile = 'cache/compressed-js/' . $matches[1] . '.js';

        $expectedCompressed = <<<EOF

/* @TestBundle/page-response-test/javascript1.js */

var a = 'abc';
/* @TestBundle/page-response-test/javascript2.js */

var b = 'cbd';
EOF;

        $compressedContent = $this->getWebFileSystem()->read($compressedFile);
        $this->assertContains($expectedCompressed, $compressedContent);
    }

    public function testCssAssets()
    {
        $response = $this->getPageResponse();
        $response->addCssFile('@TestBundle/page-response-test/style1.css');
        $response->addCss("body {font-size: 12px;}");
        $response->addCssFile('@TestBundle/page-response-test/style2.css');


        $assetsTags = $response->getAssetTags();
        $expected = <<<EOF
<link rel="stylesheet" type="text/css" href="bundles/test/page-response-test/style1.css\?c=([a-z0-9]{6})" >
<style type="text/css">
body {font-size: 12px;}
</style>
<link rel="stylesheet" type="text/css" href="bundles/test/page-response-test/style2.css\?c=([a-z0-9]{6})" >
EOF;

        $this->assertRegExp("#$expected#", $assetsTags['cssTags']);
    }

    public function testCssAssetsCompressed()
    {
        $response = $this->getPageResponse();
        $response->addCssFile('@TestBundle/page-response-test/style1.css');
        $response->addCss("body {font-size: 12px;}");
        $response->addCssFile('@TestBundle/page-response-test/style2.css');
        $response->setResourceCompression(true);

        $assetsTags = $response->getAssetTags();
        $expected = <<<EOF
<style type="text/css">
body {font-size: 12px;}
</style>
<link rel="stylesheet" type="text/css" href="cache/compressed-css/([a-z0-9]{32}).css\?c=([a-z0-9]{6})" >
EOF;

        $this->assertRegExp("#$expected#", $assetsTags['cssTags']);
    }

    public function testPrefixingDifferentEntryPointDev()
    {
        $request = new Request();
        $request->server->set('BASE', '/symfony-24/web');
        $request->server->set('REQUEST_URI', '/symfony-24/web/app_dev.php/jarves');
        $request->server->set('SCRIPT_FILENAME', '/Users/marc/bude/symfony-24/web/app_dev.php');
        $request->server->set('SCRIPT_NAME', '/symfony-24/web/app_dev.php');
        $request->getBasePath();
        $this->getJarves()->getRequestStack()->push($request);
        $response = $this->getJarves()->getPageResponse();
        $prefix = substr($this->getJarves()->getAdminPrefix(), 1);

        $response->addJsFile($prefix . '/admin/ui/languages');
        $assetsTags = $response->getAssetTags();

        $expected = '<script type="text/javascript" src="app_dev.php/jarves/admin/ui/languages"></script>';
        $this->assertEquals($expected, $assetsTags['jsTags']);
    }

    public function testPrefixingDifferentEntryPointProd()
    {
        $request = new Request();
        $request->server->set('BASE', '/symfony-24/web');
        $request->server->set('REQUEST_URI', '/symfony-24/web/jarves');
        $request->server->set('SCRIPT_FILENAME', '/Users/marc/bude/symfony-24/web/app.php');
        $request->server->set('SCRIPT_NAME', '/symfony-24/web/app.php');
        $request->getBasePath();
        $this->getJarves()->getRequestStack()->push($request);
        $response = $this->getJarves()->getPageResponse();
        $prefix = substr($this->getJarves()->getAdminPrefix(), 1);

        $response->addJsFile($prefix . '/admin/ui/languages');
        $assetsTags = $response->getAssetTags();

        $expected = '<script type="text/javascript" src="jarves/admin/ui/languages"></script>';
        $this->assertEquals($expected, $assetsTags['jsTags']);
    }

}