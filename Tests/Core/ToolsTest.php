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

namespace Jarves\Tests\Jarves;

use Jarves\Tests\TestCase;
use Jarves\Tools;

class ToolsTest extends TestCase
{
    public function testRelativePath()
    {
        $relative = Tools::getRelativePath('/anotherroot/web/file', '/root/web/other/dir');
        $this->assertEquals('../../../../anotherroot/web/file', $relative);

        $relative = Tools::getRelativePath('/root/web/file', '/root/web/other/dir');
        $this->assertEquals('../../file', $relative);

        $relative = Tools::getRelativePath('/root/web/dir/file/', '/root/web/dir');
        $this->assertEquals('file', $relative);

        $relative = Tools::getRelativePath('/root/web/other/file/', '/root/web/dir');
        $this->assertEquals('../other/file', $relative);
    }

    public function testUrlEncode()
    {
        $encoded = Tools::urlEncode('path/to/test');
        $this->assertEquals('path%252Fto%252Ftest', $encoded);
    }
}