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

namespace Jarves\Tests\Bundle;


use Jarves\Tests\KernelAwareTestCase;
use Jarves\Tools;

class BasicTest extends KernelAwareTestCase
{
    public function testGeneral()
    {
        $this->assertTrue($this->getJarves()->isActiveBundle('JarvesBundle'));
        $this->assertTrue($this->getJarves()->isActiveBundle('JarvesPublicationBundle'));
        $this->assertTrue($this->getJarves()->isActiveBundle('JarvesDemoThemeBundle'));

        $this->assertTrue($this->getJarves()->isActiveBundle('Jarves\JarvesBundle'));
        $this->assertTrue($this->getJarves()->isActiveBundle('Jarves\Publication\JarvesPublicationBundle'));
        $this->assertTrue($this->getJarves()->isActiveBundle('Jarves\DemoTheme\JarvesDemoThemeBundle'));
    }

    public function testResolvePath()
    {
        $this->markTestSkipped('Local doof');
        $path = $this->getJarves()->resolvePath('@JarvesPublicationBundle/Test', 'Resources/views', true);
        $this->assertEquals('../../../vendor/jarves/publication-bundle/Jarves/Publication/Resources/views/Test', $path);

        $path = $this->getJarves()->resolvePath('@JarvesPublicationBundle', '', true);
        $this->assertEquals('../../../vendor/jarves/publication-bundle/Jarves/Publication', $path);

        $path = $this->getJarves()->resolvePath('@JarvesPublicationBundle/Resources/views/News/list/default.html.twig', '', true);
        $this->assertEquals('../../../vendor/jarves/publication-bundle/Jarves/Publication/Resources/views/News/list/default.html.twig', $path);

    }

}
