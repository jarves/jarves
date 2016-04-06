<?php

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