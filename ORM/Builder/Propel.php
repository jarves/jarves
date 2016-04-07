<?php

namespace Jarves\ORM\Builder;

use Jarves\Admin\FieldTypes\ColumnDefinitionInterface;
use Jarves\Admin\FieldTypes\RelationDefinitionInterface;
use \Jarves\Exceptions\ModelBuildException;
use Jarves\Configuration\Object;
use Jarves\Filesystem\Filesystem;
use Jarves\Objects;
use Jarves\Propel\StandardEnglishPluralizer;
use Jarves\Storage\AbstractStorage;
use Jarves\Tools;
use Propel\Generator\Model\Column;
use Propel\Generator\Model\Database;
use Propel\Generator\Model\Table;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\HttpKernel\KernelInterface;

class Propel implements BuildInterface
{
    /**
     * @var Filesystem
     */
    protected $filesystem;

    /**
     * @var KernelInterface
     */
    protected $kernel;

    /**
     * @var Objects
     */
    protected $objects;

    protected $databases = [];

    public function __construct(Filesystem $filesystem, Objects $objects, KernelInterface $kernel)
    {
        $this->filesystem = $filesystem;
        $this->objects = $objects;
        $this->kernel = $kernel;
    }

    /**
     * @param \Jarves\Configuration\Object[] $objects
     * @param OutputInterface $output
     *
     * @param bool $overwrite
     * @throws ModelBuildException
     */
    public function build(array $objects, OutputInterface $output, $overwrite = false)
    {
        /** @var $jarves \Jarves\Jarves */
        $jarves = $this->kernel->getContainer()->get('jarves');

        $output->writeln('Propel Build');

        foreach ($objects as $object) {
            if ($this->kernel->getContainer()->get($object->getStorageService()) instanceof \Jarves\Storage\Propel) {

                $output->write('Build object ' . $object->getId() . ' => ' . $object->getTable() . ' ... ');

                $bundlePath = $jarves->getBundleDir($object->getBundle()->getName());
                $modelsFile = sprintf(
                    '%sResources/config/schema/%s.schema.xml',
                    $bundlePath,
                    strtolower($object->getTable())
                );

                if (!$overwrite && file_exists($modelsFile) && file_get_contents($modelsFile)) {
                    $xml = @simplexml_load_file($modelsFile);
                    if (false === $xml) {
                        $errors = libxml_get_errors();
                        throw new ModelBuildException(
                            sprintf(
                                'Parse error in %s: %s',
                                $modelsFile,
                                json_encode($errors, JSON_PRETTY_PRINT)
                            )
                        );
                    }
                } else {
                    $xml = simplexml_load_string('<database></database>');
                }

                $xml['namespace'] = $object->getBundle()->getNamespace() . '\\Model';
//                $xml['package'] = $object->getBundle()->getNamespace() . '\\Model';
                $xml['name'] = 'default';

                $this->declareTable($xml, $object);

                if (!is_dir(dirname($modelsFile))) {
                    mkdir(dirname($modelsFile));
                }

                file_put_contents($modelsFile, $this->getFormattedXml($xml));
                $output->writeln($modelsFile . ' written.');
                unset($xml);
            }
        }
    }

    /**
     * @param Object $object
     *
     * @return string
     */
    public function getSchema(Object $object)
    {
        $xml = simplexml_load_string('<database></database>');
        $this->declareTable($xml, $object);

        return $this->getFormattedXml($xml);
    }

    /**
     * @param $xml
     * @return string
     */
    protected function getFormattedXml($xml)
    {
        $dom = new \DOMDocument;
        $dom->preserveWhiteSpace = false;
        $dom->loadXML($xml->asXML());
        $dom->formatOutput = true;

        $xml = $dom->saveXML();
        $prefix = '<?xml version="1.0"?>';
        if (0 === strpos($xml, $prefix)) {
            $xml = substr($xml, strlen($prefix));
        }

        return trim($xml);
    }

    /**
     * {@inheritDocs}
     */
    public function needsBuild()
    {
        return !file_exists($this->kernel->getCacheDir() . '/propel-classes/');
    }

    protected function declareTable(\SimpleXMLElement $database, Object $object)
    {

        $tables = $database->xpath('table');
        $xmlTable = $this->getXmlTable($object, @$tables[0]);
        for ($i = 1; $i < count($tables); $i++) {
            unset($tables[$i][0]);
        }
        $this->sxml_append($database, $xmlTable);
    }

    protected function sxml_append(\SimpleXMLElement $to, \SimpleXMLElement $from)
    {
        $toDom = dom_import_simplexml($to);
        $fromDom = dom_import_simplexml($from);
        $toDom->appendChild($toDom->ownerDocument->importNode($fromDom, true));
    }

    /**
     * @param \Jarves\Configuration\Object $object
     * @param \SimpleXMLElement $objectTable
     *
     * @return \SimpleXMLElement
     *
     * @throws \Jarves\Exceptions\ModelBuildException
     */
    protected function getXmlTable(Object $object, \SimpleXMLElement $objectTable = null)
    {
        if (!$objectTable) {
            $objectTable = new \SimpleXMLElement('<table />'); //simplexml_load_string('<database></database>');
        }

        if (!$object->getTable()) {
            throw new ModelBuildException(sprintf('The object `%s` has no table defined', $object->getId()));
        }
        $objectTable['name'] = $object->getTable();
        $objectTable['phpName'] = ucfirst($object->getId());

        if ($object->isCrossRef()) {
            $objectTable['isCrossRef'] = 'true';
        }

        $columnsDefined = array();

        if (!$object->getFields()) {
            throw new ModelBuildException(sprintf('The object `%s` has no fields defined', $object->getId()));
        }

        foreach ($object->getFields() as $field) {

            if ($columns = $field->getFieldType()->getColumns()) {
                foreach ($columns as $column) {
                    $name = Tools::camelcase2Underscore($column->getName());

                    //column exist?
                    $eColumns = $objectTable->xpath('column[@name =\'' . $name . '\']');

                    if ($eColumns) {
                        $newCol = current($eColumns);
                        if ($newCol['custom'] == true) {
                            continue;
                        }
                    } else {
                        $newCol = $objectTable->addChild('column');
                    }

                    $columnsDefined[] = $name;

                    $this->setupColumnAttributes($column, $newCol);

                    if ($field->isRequired()) {
                        $newCol['required'] = 'true';
                    }

                    if ($field->isPrimaryKey()) {
                        $newCol['primaryKey'] = 'true';
                    }

                    if ($field->isAutoIncrement()) {
                        $newCol['autoIncrement'] = 'true';
                    }
                }
            }
        }

        if ($relations = $object->getRelations()) {
            foreach ($relations as $relation) {
                $this->addRelation($object, $relation, $objectTable);
            }
        }

        if ($object->isNested()) {
            $behaviors = $objectTable->xpath('behavior[@name=\'nested_set\']');
            if ($behaviors) {
                $behavior = current($behaviors);
            } else {
                $behavior = $objectTable->addChild('behavior');
            }
            if (!$behavior['custom']) {
                $behavior['name'] = 'nested_set';

                $parameters = [
                    'left_column' => 'lft',
                    'right_column' => 'rgt',
                    'level_column' => 'lvl'
                ];

                if ($object->getNestedRootAsObject()) {
                    $parameters['use_scope'] = 'true';
                    $parameters['scope_column'] = Tools::camelcase2Underscore($object->getNestedRootObjectField());
                }

                foreach ($parameters as $k => $v) {
                    $parameter = $behavior->addChild('parameter');
                    $parameter['name'] = $k;
                    $parameter['value'] = $v;
                }
            }
        }

        if ($object['workspace']) {
            $behaviors = $objectTable->xpath('behavior[@name=\'Jarves\Propel\Behavior\WorkspaceBehavior\']');
            if ($behaviors) {
                $behavior = current($behaviors);
            } else {
                $behavior = $objectTable->addChild('behavior');
            }
            $behavior['name'] = 'Jarves\Propel\Behavior\WorkspaceBehavior';
        }

        $vendors = $objectTable->xpath('vendor[@type=\'mysql\']');
        if ($vendors) {
            foreach ($vendors as $k => $v) {
                unset($vendors[$k][0]);
            }
        }

        $vendor = $objectTable->addChild('vendor');
        $vendor['type'] = 'mysql';

        $params = $vendor->xpath('parameter[@name=\'Charset\']');
        if ($params) {
            $param = current($params);
        } else {
            $param = $vendor->addChild('parameter');
        }

        $param['name'] = 'Charset';
        $param['value'] = 'utf8';

        return $objectTable;

//        $dom = new \DOMDocument;
//        $dom->preserveWhiteSpace = false;
//        $dom->loadXML($xml->asXML());
//        $dom->formatOutput = true;
//
//        $xml = $dom->saveXML();
//        $prefix = '<?xml version="1.0"? >';
//        if (0 === strpos($xml, $prefix)) {
//            $xml = substr($xml, strlen($prefix));
//        }
//
//        return trim($xml);
    }

    protected function addRelation(Object $object, RelationDefinitionInterface $relation, &$xmlTable)
    {
        $possibleRelations = [
            AbstractStorage::MANY_TO_ONE,
            AbstractStorage::ONE_TO_ONE
        ];

        if (in_array($relation->getType(), $possibleRelations)) {
            $this->addForeignKey($object, $relation, $xmlTable);
        }
    }

    protected function addForeignKey(Object $object, RelationDefinitionInterface $relation, &$xmlTable)
    {
        $relationName = $relation->getName();
        $foreignObject = $this->objects->getDefinition($relation->getForeignObjectKey());

        if (!$foreignObject) {
            throw new ModelBuildException(
                sprintf(
                    'Foreign object `%s` does not exist in relation `%s`',
                    $relation->getForeignObjectKey(),
                    $relation->getName()
                )
            );
        }

        if ($object->getStorageService() !== $foreignObject->getStorageService()) {
            throw new ModelBuildException(
                sprintf(
                    'Can not create a relation between two different dataModels. Got `%s` but `%s` is needed.',
                    $foreignObject->getStorageService(),
                    $object->getStorageService()
                )
            );
        }

        $pluralizer = new StandardEnglishPluralizer();
        $foreignPhpName = ucfirst($pluralizer->getSingularForm(lcfirst($relationName)));

        $foreigns = $xmlTable->xpath('foreign-key[@phpName=\'' . $foreignPhpName . '\']');
        if ($foreigns) {
            $foreignKey = current($foreigns);
        } else {
            $foreignKey = $xmlTable->addChild('foreign-key');
        }


        $foreignKey['phpName'] = $foreignPhpName;
        $foreignKey['foreignTable'] = $foreignObject->getTable();

        if ($refName = $relation->getRefName()) {
            $foreignKey['refPhpName'] = ucfirst($pluralizer->getSingularForm(lcfirst($refName)));
        }

        $foreignKey['onDelete'] = $relation->getOnDelete();
        $foreignKey['onUpdate'] = $relation->getOnUpdate();

        if (!$relation->getWithConstraint()) {
            $foreignKey['skipSql'] = 'true';
        }

        $references = $foreignKey->xpath("reference[not(@custom='true')]");
        foreach ($references as $i => $ref) {
            unset($references[$i][0]);
        }

        foreach ($relation->getReferences() as $reference) {
            $localName = Tools::camelcase2Underscore($reference->getLocalColumn()->getName());
            $references = $foreignKey->xpath('reference[@local=\'' . $localName . '\']');
            if ($references) {
                $xmlReference = current($references);
            } else {
                $xmlReference = $foreignKey->addChild('reference');
            }

            $xmlReference['local'] = $localName;
            $xmlReference['foreign'] = Tools::camelcase2Underscore($reference->getForeignColumn()->getName());
        }

        if ($foreignObject->getWorkspace()) {
            if (!$object->getWorkspace()) {
                $columns = $xmlTable->xpath('column[@name=\'workspace_id\']');
                if (!$columns) {
                    $newCol = $xmlTable->addChild('column');
                    $newCol['name'] = 'workspace_id';
                    $newCol['type'] = 'INTEGER';
                    $newCol['defaultValue'] = '1';
                }
            }

            $localName = 'workspace_id';
            $references = $foreignKey->xpath('reference[@local=\'' . $localName . '\']');
            if ($references) {
                $xmlReference = current($references);
            } else {
                $xmlReference = $foreignKey->addChild('reference');
            }

            $xmlReference['local'] = $localName;
            $xmlReference['foreign'] = 'workspace_id';
        }
    }

    protected function setupColumnAttributes(ColumnDefinitionInterface $column, $xmlColumn)
    {
        $xmlColumn['name'] = Tools::camelcase2Underscore($column->getName());

        $type = $column->getSqlDataType();
        $size = null;
        if (false !== $pos = strpos($type, '(')) {
            $size = trim(str_replace(['(', ')'], '', substr($type, $pos)));
            $type = substr($type, 0, $pos);
        }

        $propelType = $this->getPropelColumnType($type);

        $xmlColumn['type'] = strtoupper($propelType);

        if ($size) {
            $xmlColumn['size'] = $size;
        }
    }

    /**
     * Transform some sql types to propel types
     *
     * @param string $type
     * @return mixed
     */
    protected function getPropelColumnType($type)
    {
        $map = [
            'text' => 'LONGVARCHAR',
        ];

        return @$map[strtolower($type)] ?: $type;
    }

}