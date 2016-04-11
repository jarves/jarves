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

namespace Jarves\Configuration;


use Jarves\Filesystem\Filesystem;

class ConfigurationOperator
{
    /**
     * @var Filesystem
     */
    private $localFilesystem;

    /**
     * @param Filesystem $localFilesystem
     */
    public function __construct(Filesystem $localFilesystem)
    {
        $this->localFilesystem = $localFilesystem;
    }

    /**
     * @param Bundle $bundle
     * @param $property
     * @return bool
     */
    public function saveFileBased(Bundle $bundle, $property)
    {
        $xml = $bundle->exportFileBased($property);
        $xmlFile = $bundle->getPropertyFilePath($property);

        $emptyXml = '<config>
  <bundle/>
</config>';

        if ($xml == $emptyXml) {
            if ($this->localFilesystem->has($xmlFile)) {
                return $this->localFilesystem->delete($xmlFile);
            } else {
                return true;
            }
        } else {
            return $this->localFilesystem->write($xmlFile, $xml);
        }
    }
}