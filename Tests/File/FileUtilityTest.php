<?php

namespace Jarves\Tests\Service\Object;

use Jarves\Filesystem\FilesystemInterface;
use Jarves\Tests\KernelAwareTestCase;

class FileUtilityTest extends KernelAwareTestCase
{

    public function testTempFile()
    {
        $this->fileTester($this->getJarves()->getCacheFileSystem(), $this->getKernel()->getCacheDir().'/');
    }

    public function testSystemFile()
    {
        $this->fileTester($this->getJarves()->getFileSystem(), realpath($this->getKernel()->getRootDir().'/..').'/');
    }

    public function testWebFile()
    {
        $this->fileTester($this->getJarves()->getWebFileSystem(), realpath($this->getKernel()->getRootDir().'/../web').'/');
    }

    /**
     * @param FilesystemInterface $fs
     * @param string        $realPath
     */
    public function fileTester(FilesystemInterface $fs, $realPath)
    {
        $content = "
        asdasldm aisdh ad
        as das[odj aopsdja d
        [asj dpoashd ojadsofasdhfgat972
        3gtqohvj a-a9hg a
        sfghads
        fghasd-9gh asghasg
";

        $file = 'test_utility/test_temp_file.php';
        $fs->write($file, $content);

        $fileObj = $fs->getFile($file);
        $this->assertInstanceOf('Jarves\\File\\FileInfoInterface', $fileObj);

        $this->assertFileExists($realPath . $file);
        $this->assertTrue($fs->has($file));
        $this->assertEquals($content, $fs->read($file));


        $fs->delete($file);
        $this->assertFileNotExists($realPath . $file);
        $this->assertFalse($fs->has($file));


        file_put_contents($realPath . $file, $content);
        $this->assertFileExists($realPath . $file);
        $this->assertTrue($fs->has($file));
        $this->assertEquals($content, $fs->read($file));

        $fs->delete(dirname($file));
        $this->assertFalse($fs->has(dirname($file)));


        $dir = 'test_utility_folder';
        $fs->mkdir($dir);
        $this->assertFileExists($realPath . $dir);
        $this->assertTrue($fs->has($dir));

        for ($i = 2; $i <= 10; $i++) {
            $fs->write($dir . '/file' . $i, $i);
            $this->assertEquals($i, $fs->read($dir . '/file' . $i));
        }
        $fs->write($dir . '/file1', 1); //to have another order

        $files = $fs->getFiles($dir);
        $this->assertCount(10, $files);
        $this->assertEquals(10, $fs->getCount($dir));

        $this->assertInstanceOf('Jarves\\File\\FileInfoInterface', $files[0]);
        $this->assertEquals('file1', $files[0]->getName());
        $this->assertEquals('file5', $files[4]->getName());
        $this->assertEquals('file10', $files[9]->getName());

        $file1 = $fs->getFile($dir . '/file1');
        $this->assertInstanceOf('Jarves\\File\\FileInfoInterface', $file1);
        $this->assertEquals('/test_utility_folder/file1', $file1->getPath());
        $this->assertEquals('file1', $file1->getName());
        $this->assertEquals('/test_utility_folder', $file1->getDir());
        $this->assertEquals('file', $file1->getType());
        $this->assertTrue($file1->isFile());
        $this->assertFalse($file1->isDir());

        $copy = 'test_utility_folder2';
        $fs->copy($dir, $copy);
        $this->assertEquals(10, $fs->getCount($copy));
        $file1 = $fs->getFile($copy . '/file1');
        $this->assertEquals($fs->read($copy . '/file1'), '1');
        $this->assertEquals('/test_utility_folder2/file1', $file1->getPath());
        $this->assertTrue($file1->isFile());
        $this->assertEquals('file1', $file1->getName());

        $copyDir = $fs->getFile($copy);
        $this->assertTrue($copyDir->isDir());

        $fs->delete($dir);
        $this->assertFileNotExists($realPath . $dir);
        $this->assertFalse($fs->has($dir));

        $fs->delete('test_utility_folder');
        $fs->delete('test_utility_folder2');
    }

}
