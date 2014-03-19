<?php

namespace Jarves\Admin;

class AppKernelModifier
{

    /**
     * @var array
     */
    protected $bundles = [];
    protected $removeBundles = [];
    protected $addBundles = [];

    protected $length;
    protected $script;
    protected $position;

    function __construct()
    {
        $this->loadBundles();
    }

    public function loadBundles()
    {
        $appKernelPath = new \ReflectionClass('AppKernel');
        $file = $appKernelPath->getFileName();
        $content = file_get_contents($file);

        preg_match('/function registerBundles.*/mis', $content, $match);

        if (!isset($match[0])) {
            throw new \LogicException('Method `registerBundles` not found in AppKernel class.');
        }
        $this->script = $match[0];

        preg_match('/\$bundles = array\((.*)\);/mis', $this->script, $match);

        if (!isset($match[0])) {
            throw new \LogicException('In `registerBundles` of AppKernel class there is no $bundles = array(...) assignment.');
        }

        $inBundles = false;
        $bundles = '';
        $inBlockComment = false;
        $inComment = false;

        $this->length = strlen($this->script);
        for ($this->position = 0; $this->position < $this->length; $this->position++) {

            if ($inComment || $inBlockComment) {
                //search for comment ends
                if (!$inBlockComment && $inComment && $this->expect("\n")) {
                    $inComment = false;
                }

                if (!$inComment && $inBlockComment && $this->expect('*/')) {
                    $inBlockComment = false;
                }
                continue;
            } else {
                //search for comment starts
                if (!$inBlockComment && $this->expect('//')) {
                    $inComment = true;
                }

                if (!$inComment && $this->expect('/*')) {
                    $inBlockComment = true;
                }
            }

            if (!$inBundles) {
                if ($this->expect('$')) {
                    if ($this->eat('$bundles')) {
                        $inBundles = true;
                    }
                }
            } else {
                if ($this->expect(');')) {
                    break;
                }
                if ($this->eat('new ')) {
                    preg_match('/[a-zA-Z0-9\\\\_]+/', substr($this->script, $this->position), $match);
                    $bundles[] = $match[0];
                }
            }
        }
        $this->bundles = $bundles;
    }

    /**
     * @return array
     */
    public function getBundles()
    {
        return $this->bundles;
    }

    public function removeBundle($bundleClass)
    {
        if (in_array($bundleClass, $this->bundles)) {
            $this->removeBundles[] = $bundleClass;

            return true;
        }

        return false;
    }

    public function addBundle($bundleClass)
    {
        if (!in_array($bundleClass, $this->bundles)) {
            $this->addBundles[] = $bundleClass;

            return true;
        }

        return false;
    }

    public function save()
    {
        if (!$this->addBundles && !$this->removeBundles) {
            return false;
        }

        $appKernelPath = new \ReflectionClass('AppKernel');
        $file = $appKernelPath->getFileName();
        $this->script = file_get_contents($file);

        $inBundles = false;
        $inRegisterBundles = false;
        $inBlockComment = false;
        $inComment = false;

        $bundles = $this->bundles;
        foreach ($this->addBundles as $bundle) {
            $bundles[] = $bundle;
        }
        foreach ($this->removeBundles as $bundle) {
            $pos = array_search($bundle, $bundles);
            unset($bundles[$pos]);
        }

        $this->length = strlen($this->script);
        for ($this->position = 0; $this->position < $this->length; $this->position++) {

            if ($inComment || $inBlockComment) {
                //search for comment ends
                if (!$inBlockComment && $inComment && $this->expect("\n")) {
                    $inComment = false;
                }

                if (!$inComment && $inBlockComment && $this->expect('*/')) {
                    $inBlockComment = false;
                }
                continue;
            } else {
                //search for comment starts
                if (!$inBlockComment && $this->expect('//')) {
                    $inComment = true;
                }

                if (!$inComment && $this->expect('/*')) {
                    $inBlockComment = true;
                }
            }

            if (!$inBundles) {
                if (!$inRegisterBundles) {
                    if ($this->expect('function registerBundles')) {
                        $inRegisterBundles = true;
                    }
                } else {
                    if ($this->expect('$bundles')) {
                        $inBundles = true;
                    }
                }

            }

            if ($inBundles) {

                if ($this->expect(');')) {
                    $this->remove(2);

                    $code = "\$bundles = array(\n";
                    foreach ($bundles as $bundle) {
                        $code .= "            new $bundle(),\n";
                    }

                    $code .= "        );";

                    $this->write($code);
                    break;

                } else {
                    $this->remove(1);
                }
            }
        }
        return !!file_put_contents($file, $this->script);
    }

    public function write($string)
    {
        $this->script = substr($this->script, 0, $this->position + 1) . $string . substr($this->script, $this->position);
        $this->position += strlen($string);
        $this->length += strlen($string);
    }

    public function remove($string)
    {
        $this->script = substr($this->script, 0, $this->position)
            . substr($this->script, $this->position + (is_string($string) ? strlen($string) : $string));
        $this->position -= 1;
        $this->length -= (is_string($string) ? strlen($string) : $string);
    }

    public function eatBackUntil($string)
    {
        $position = $this->position;
        $stringLength = strlen($string);

        do {
            $position -= $stringLength;
            $currentString = substr($this->script, $position - $stringLength, $stringLength);
        } while ($currentString !== $string && $position >= 0);

        $length = $this->position - $position;
        if ($position) {
            $this->script = substr($this->script, 0, $position) . substr($this->script, $this->position);
            $this->length -= $this->position - $position;
            $this->position -= $this->position - $position;
        }

        return $length;
    }

    /**
     * @param $string
     * @return bool
     */
    public function eat($string)
    {
        if ($this->expect($string)) {
            $this->position += strlen($string);

            return true;
        }

        return false;
    }

    /**
     * @param $string
     * @return bool
     */
    public function expect($string)
    {
        return $string === substr($this->script, $this->position, strlen($string));
    }
}