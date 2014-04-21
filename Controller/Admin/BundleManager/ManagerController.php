<?php

namespace Jarves\Controller\Admin\BundleManager;

use Composer\Autoload\AutoloadGenerator;
use Composer\Composer;
use Composer\DependencyResolver\DefaultPolicy;
use Composer\DependencyResolver\Pool;
use Composer\EventDispatcher\EventDispatcher;
use Composer\Factory;
use Composer\Installer;
use Composer\IO\BufferIO;
use Composer\Package\Version\VersionParser;
use Composer\Repository\CompositeRepository;
use Composer\Repository\PlatformRepository;
use Composer\Repository\RepositoryInterface;
use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Exceptions\BundleNotFoundException;
use Jarves\Exceptions\FileNotWritableException;
use Jarves\Exceptions\InvalidArgumentException;
use Jarves\Exceptions\PackageNotFoundException;
use Jarves\Admin\AppKernelModifier;
use Jarves\Controller;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use FOS\RestBundle\Controller\Annotations as Rest;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;

class ManagerController extends Controller
{
    /**
     * @var BufferIO
     */
    private $composerIO;

    /**
     * @var Composer
     */
    private $composer;

    protected $versionParser;

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Deactivates a bundle in the AppKernel"
     * )
     *
     * @Rest\RequestParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     *
     * @Rest\Post("/admin/system/bundle/manager/deactivate")
     *
     * @param string $bundle
     *
     * @return boolean
     */
    public function deactivateAction($bundle)
    {
        Manager::prepareName($bundle);

        $bundle = $this->getJarves()->getBundle($bundle);

        if ($bundle) {
            $appModifier = new AppKernelModifier();
            $appModifier->removeBundle(get_class($bundle));
            return $appModifier->save();
        }

        return false;
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Creates a Symfony bundle"
     * )
     *
     * @Rest\RequestParam(name="package", requirements=".+", strict=true, description="The composer package name")
     * @Rest\RequestParam(name="namespace", requirements=".+", description="The PHP namespace")
     * @Rest\RequestParam(name="directoryStructure", requirements=".+", default="false", description="If some directory structures should be created")
     *
     * @Rest\Put("/admin/system/bundle/manager")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @throws InvalidArgumentException
     * @return bool
     */
    public function createBundleAction(ParamFetcher $paramFetcher)
    {
        $package = $paramFetcher->get('package');
        $namespace = $paramFetcher->get('namespace');
        $directoryStructure = filter_var($paramFetcher->get('directoryStructure'), FILTER_VALIDATE_BOOLEAN);

        if (!preg_match('/^([a-zA-Z0-9_-]+)\\/([a-zA-Z0-9_\\.-]+)$/', $package)) {
            throw new InvalidArgumentException('`package` is not a correct composer name.');
        }
        if (!preg_match('/^(([a-zA-Z0-9_-]+)\\\\)*([a-zA-Z0-9_-]*)Bundle/', $namespace)) {
            throw new InvalidArgumentException('`package` is not a correct composer name.');
        }

        $directoryStructure = filter_var($directoryStructure, FILTER_VALIDATE_BOOLEAN);

        $classDir = './src/' . str_replace('\\', '/', $namespace);
        mkdir($classDir, 0777, true);

        $bundleClassName = str_replace('\\Bundle\\', '\\', $namespace);
        $bundleClassName = str_replace('\\', '', $namespace);
        $classFile = $classDir . '/' . $bundleClassName . '.php';
        $composerFile = $classDir . '/composer.json';

        $fs = $this->getJarves()->getFileSystem();

        $classPhp = sprintf(
            '<?php

            namespace %s;

            use Symfony\Component\HttpKernel\Bundle\Bundle;

            class %s extends Bundle {

            }
            ',
            $namespace,
            $bundleClassName
        );

        $fs->write($classFile, $classPhp);

        $composer = array(
            'repositories' => array(
                array(
                    'type' => 'composer',
                    'url' => 'http:\/\/packages.jarves.io\/'
                )
            ),
            'name' => $package,
            'target-dir' => str_replace('\\', '/', $namespace),
            'autoload' => array(
                'psr-0' => array(
                    $namespace => './'
                )
            )
        );

        $fs->write($composerFile, json_encode($composer, JSON_PRETTY_PRINT));

        if ($directoryStructure) {
            $fs->mkdir($classDir . '/Controller');
            $fs->mkdir($classDir . '/Resources');
            $fs->mkdir($classDir . '/Resources/views');
            $fs->mkdir($classDir . '/Resources/screenshots');
            $fs->mkdir($classDir . '/Resources/doc');
            $fs->mkdir($classDir . '/Resources/doc/images');
            $fs->mkdir($classDir . '/Resources/public');
            $fs->mkdir($classDir . '/Resources/config');

            $jarvesXml = "<config>
  <bundle>
    <label>$bundleClassName</label>
  </bundle>
</config>";
            $fs->write($classDir . '/Resources/config/jarves.xml', $jarvesXml);

            $line = str_repeat('=', strlen($bundleClassName));
            $docuIndex = "$bundleClassName
$line

This is the bundle $bundleClassName.
";

            $fs->write($classDir . '/Resources/doc/index.md', $docuIndex);

        }

        return true;
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Activates a bundle in the AppKernel"
     * )
     *
     * @Rest\RequestParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     *
     * @Rest\Post("/admin/system/bundle/manager/activate")
     *
     * @param string $bundle
     *
     * @return boolean
     */
    public function activateAction($bundle)
    {
        Manager::prepareName($bundle);

        $appModifier = new AppKernelModifier();
        if (class_exists($bundle)) {
            if ($appModifier->addBundle($bundle)) {
                $appModifier->save();

                return true;
            }
        }

        return false;
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Returns composer information for given package"
     * )
     *
     * @Rest\QueryParam(name="name", requirements="[a-zA-Z0-9/]", strict=true, description="The composer package name")
     *
     * @Rest\Get("/admin/system/bundle/manager/info")
     *
     * @param string $name
     *
     * @return array
     */
    public function getInstalledInfoAction($name)
    {
        $fs = $this->getJarves()->getFileSystem();
        if ($fs->has('composer.lock')) {
            $composerLock = $fs->read('composer.lock');
            if ($composerLock) {
                $composerLock = json_decode($composerLock, true);

                foreach ($composerLock['packages'] as $package) {
                    if (strtolower($package['name']) == strtolower($name)) {
                        return $package;
                    }
                }
            }
        }

        return [];
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Returns a list of all installed bundles and packages"
     * )
     *
     * @Rest\Get("/admin/system/bundle/manager/installed")
     *
     * @return array
     */
    public function getInstalledAction()
    {
        $packages = [];
        $bundles = [];
        $fs = $this->getJarves()->getFileSystem();

        if ($fs->has('composer.json')) {
            $composer = $fs->read('composer.json');
            if ($composer) {
                $composer = json_decode($composer, true);

                $installedVersions = [];
                if ($fs->has('composer.lock')) {
                    $locker = $fs->read('composer.lock');
                    $locker = json_decode($locker, true);
                    if ($locker) {
                        foreach ($locker['packages'] as $package) {
                            $version = $package['version'];
                            $ref = false;
                            if ('dev-master' === $version) {
                                if ($package['source']) {
                                    $ref = substr($package['source']['reference'], 0, 7);
                                } else {
                                    if ($package['dist']) {
                                        $ref = substr($package['source']['reference'], 0, 7);
                                    }
                                }
                            }
                            if ($ref) {
                                $version = [
                                    'version' => $version,
                                    'reference' => $ref
                                ];
                            }

                            $installedVersions[strtolower($package['name'])] = $version;
                        }
                    }
                }

                $packages = [];

                foreach ((array)$composer['require'] as $name => $version) {
                    if ('php' == $name) {
                        continue;
                    }
                    $package = [
                        'name' => $name,
                        'version' => $version,
                        'installed' => @$installedVersions[strtolower($name)]
                    ];
                    $packages[] = $package;
                }
            }
        }

        $bundleClasses = array_merge(
            $this->getBundlesFromPath('vendor'),
            $this->getBundlesFromPath('src')
        );

        if ($bundleClasses) {
            foreach ($bundleClasses as $bundle) {
                if (!class_exists($bundle)) {
                    continue;
                }

                $reflection = new \ReflectionClass($bundle);
                $current = realpath($this->getJarves()->getKernel()->getRootDir() . '/../');
                $path = substr(dirname($reflection->getFileName()), strlen($current) + 1);

                if (false !== strpos($path, 'vendor/')) {
                    $expl = explode('/', $path);
                    $package = $expl[1] . '/' . $expl[2];
                } else {
                    $package = 'local ./src/';
                }
                $bundleInfo = [
                    'class' => $bundle,
                    'package' => $package,
                    'path' => $reflection->getFileName(),
                    'active' => $this->getJarves()->isActiveBundle($bundle)
                ];
                $bundles[] = $bundleInfo;
            }
        }

        return [
            'packages' => $packages,
            'bundles' => $bundles
        ];
    }

    /**
     * @param string $path
     * @return array
     */
    protected function getBundlesFromPath($path)
    {
        $bundles = [];
        if ($this->getJarves()->getFileSystem()->has($path)) {

            $finder = new \Symfony\Component\Finder\Finder();
            $finder
                ->files()
                ->name('*Bundle.php')
                ->notPath('/\/Tests\//')
                ->notPath('/\/Test\//')
                ->notPath('Tests/Integration/skeletion')
                ->notPath('Jarves/vendor')
                ->in($this->getKernel()->getRootDir() . '/../' . $path);

            /** @var \Symfony\Component\Finder\SplFileInfo $file */
            foreach ($finder as $file) {

                $file = $file->getRealPath();
                $content = file_get_contents($file);
                preg_match('/^\s*\t*class ([a-z0-9_]+)/mi', $content, $className);
                if (isset($className[1]) && $className[1]) {
                    preg_match('/\s*\t*namespace ([a-zA-Z0-9_\\\\]+)/', $content, $namespace);
                    $class = (isset($namespace[1]) ? $namespace[1] . '\\' : '') . $className[1];

                    if ('Bundle' === $className[1]) {
                        continue;
                    }

                    if (class_exists($class)) {

                        $reflection = new \ReflectionClass($class);
                        $interfaces = $reflection->getInterfaceNames();
                        if (in_array('Symfony\Component\HttpKernel\Bundle\BundleInterface', $interfaces)) {
                            $bundles[] = $class;
                        }
                    }
                }
            }
        }

        return $bundles;
    }

    /**
     * @param $local
     * @param $server
     * @return string
     */
    private static function versionCompareToServer($local, $server)
    {
        list($major, $minor, $patch) = explode(".", $local);
        $lversion = $major * 1000 * 1000 + $minor * 1000 + $patch;

        list($major, $minor, $patch) = explode(".", $server);
        $sversion = $major * 1000 * 1000 + $minor * 1000 + $patch;

        if ($lversion == $sversion) {
            return '=';
        } // Same version
        else {
            if ($lversion < $sversion) {
                return '<';
            } // Local older
            else {
                return '>';
            }
        } // Local newer
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Returns a list of all local available bundles and packages"
     * )
     *
     * @Rest\Get("/admin/system/bundle/manager/local")
     *
     * @return array
     */
    public function getLocalAction()
    {
        $finder = new \Symfony\Component\Finder\Finder();
        $root = $this->getJarves()->getKernel()->getRootDir();

        $finder
            ->files()
            ->ignoreUnreadableDirs()
            ->name('*Bundle.php')
            ->exclude('Jarves/vendor')
            ->exclude('/\/Test\//')
            ->exclude('/\/Tests\//');

        if (file_exists($root . '/../vendor')) {
            $finder->in($root . '/../vendor');
        }
        if (file_exists($root . '/../src')) {
            $finder->in($root . '/../src');
        }

        return $this->getBundles($finder);
    }

    /**
     * @param \Symfony\Component\Finder\Finder $finder
     * @return array
     */
    protected function getBundles(\Symfony\Component\Finder\Finder $finder)
    {
        $bundles = array();
        /** @var \Symfony\Component\Finder\SplFileInfo $file */
        foreach ($finder as $file) {

            $file = $file->getRealPath();
            $content = file_get_contents($file);
            preg_match('/^\s*\t*class ([a-z0-9_]+)/mi', $content, $className);
            if (isset($className[1]) && $className[1]) {
                preg_match('/\s*\t*namespace\s*\t*([a-zA-Z0-9_\\\\]+)/i', $content, $namespace);
                $class = (count($namespace) > 1 ? $namespace[1] . '\\' : '') . $className[1];

                if ('Bundle' === $className[1] || false !== strpos($class, '\\Test\\') ||
                    false !== strpos($class, '\\Tests\\')
                ) {
                    continue;
                }

                $bundles[] = $class;
            }
        }
        $bundles = array_unique($bundles);

        $res = [];
        foreach ($bundles as $bundleClass) {

            if (!class_exists($bundleClass)) {
                continue;
            }
            $name = basename(str_replace('\\', '//', $bundleClass));

            $reflection = new \ReflectionClass($bundleClass);
            $interfaces = $reflection->getInterfaceNames();
            if (in_array('Symfony\Component\HttpKernel\Bundle\BundleInterface', $interfaces)) {

                $composer = $this->getJarves()->getUtils()->getComposerArray($bundleClass) ? : [];
                $composer['_path'] = $this->getJarves()->getBundleDir($bundleClass);
                if (isset($composer['name'])) {
                    $composer['_installed'] = $this->getInstalledInfoAction($composer['name']);
                } else {
                    $composer['_installed'] = [];
                }
                $composer['_bundleName'] = $this->getJarves()->getBundleName($bundleClass);
                $composer['activated'] = $this->getJarves()->isActiveBundle($name);
                $composer['jarvesBundle'] = $this->getJarves()->isJarvesBundle($name);
                $res[$bundleClass] = $composer;
            }
        }

        return $res;
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Checks for updates in composer packages"
     * )
     *
     * @Rest\Get("/admin/system/bundle/manager/check-updates")
     *
     * @return array
     */
    public function check4UpdatesAction()
    {
        $res = [];
        foreach ($this->getKernel()->getBundles() as $bundleName => $bundle) {
            $composer = $this->getJarves()->getUtils()->getComposerArray($bundleName) ? : [];
            $version = @$composer['version'];
            if ($version && $version != '' && self::versionCompareToServer(
                    $version,
                    $version['content']
                ) == '<'
            ) {
                $temp = array();
                $temp['newVersion'] = $version;
                $temp['bundle'] = $bundleName;
                $res[] = $temp;
            }
        }

        return $res;
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Installs a bundle"
     * )
     *
     * @param  string $bundle
     * @param  bool $ormUpdate
     *
     * @return bool
     */

    /**
     * @Rest\QueryParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     * @Rest\QueryParam(name="ormUpdate", requirements=".+", default="false", description="If the orm should be updated")
     *
     * @Rest\Post("/admin/system/bundle/manager/install")
     *
     * @param string $bundle
     * @param bool   $ormUpdate
     *
     * @return array
     */
    public function installAction($bundle, $ormUpdate = null)
    {
        $ormUpdate = filter_var($ormUpdate, FILTER_VALIDATE_BOOLEAN);

        Manager::prepareName($bundle);
        $fs = $this->getJarves()->getFileSystem();

        $hasPropelModels = $fs->has($this->getJarves()->getBundleDir($bundle) . 'Resources/config/models.xml');
        $this->firePackageManager($bundle, 'install');

        //fire update propel orm
        if ($ormUpdate && $hasPropelModels) {
            //update propel
            $this->getJarves()->getEventDispatcher()->dispatch('core/bundle/schema-update', $bundle);
        }

        $this->activateAction($bundle);

        $this->firePackageManager($bundle, 'install');

        return true;
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Uninstalls a bundle"
     * )
     *
     * Removes relevant data and object's data. Executes also the uninstall script.
     * Removes database values, some files etc.
     *
     * @Rest\QueryParam(name="bundle", requirements=".+", strict=true, description="The bundle name")
     * @Rest\QueryParam(name="removeFiles", requirements=".+", default="true", description="If the orm should be updated")
     * @Rest\QueryParam(name="ormUpdate", requirements=".+", default="false", description="If the orm should be updated")
     *
     * @Rest\Post("/admin/system/bundle/manager/install")
     *
     * @param string $bundle
     * @param bool   $ormUpdate
     * @param bool   $removeFiles
     *
     * @throws BundleNotFoundException
     * @return bool
     */
    public function uninstallAction($bundle, $ormUpdate = null, $removeFiles = null)
    {
        $ormUpdate = filter_var($ormUpdate, FILTER_VALIDATE_BOOLEAN);
        $removeFiles = filter_var($removeFiles, FILTER_VALIDATE_BOOLEAN);

        Manager::prepareName($bundle);
        $fs = $this->getJarves()->getFileSystem();

        $path = $this->getJarves()->getBundleDir($bundle);
        if (!$path) {
            throw new \Jarves\Exceptions\BundleNotFoundException();
        }

        $hasPropelModels = $fs->has($path . 'Resources/config/model.xml');

        $this->firePackageManager($bundle, 'uninstall');

        $this->deactivateAction($bundle);

        //fire update propel orm
        if ($ormUpdate && $hasPropelModels) {
            //update propel
            if ($ormUpdate) {
                $this->getJarves()->getEventDispatcher()->dispatch('core/bundle/schema-update', $bundle);
            }
        }

        //remove files
        if (filter_var($removeFiles, FILTER_VALIDATE_BOOLEAN)) {
            $fs->delete($path);
            if (0 === strpos($path, $this->getComposerVendorDir())) {
                $path = explode('/', $path);
                $composerName = $path[1] . '/' . $path[2];
                $this->uninstallComposerAction($composerName);
            }
        }

        return true;
    }

    /**
     * @return string
     */
    protected function getComposerVendorDir()
    {
        return './vendor/';
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Uninstalls a composer package and deactivates its containing bundle"
     * )
     *
     * @Rest\QueryParam(name="name", requirements=".+", strict=true, description="The composer package name")
     *
     * @Rest\Post("/admin/system/bundle/manager/composer/uninstall")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return string
     * @throws FileNotWritableException
     * @throws PackageNotFoundException
     */
    public function uninstallComposerAction(ParamFetcher $paramFetcher)
    {
        $name = $paramFetcher->get('name');

        $fs = $this->getFileSystem();
        if ($fs->has('composer.json') && is_string($name)) {
            $composer = $fs->read('composer.json');
            if ($composer) {
                $composer = json_decode($composer, true);
                if (is_array($composer)) {
                    $pathToDelete = false;
                    foreach ($composer['require'] as $key => $value) {
                        if (strtolower($key) == strtolower($name)) {
                            unset($composer['require'][$key]);
                            $pathToDelete = $key;
                        }
                    }
                    $fs->write('composer.json', json_encode($composer, JSON_PRETTY_PRINT));

                    if ($pathToDelete) {
                        $this->searchAndUninstallBundles($this->getComposerVendorDir() . $pathToDelete);
                        $fs->delete($this->getComposerVendorDir() . $pathToDelete);
                        if (file_exists($pathToDelete)) {
                            $this->getLogger()->warning(
                                sprintf('[UninstallComposer] Can not delete folder `%s`.', $pathToDelete)
                            );
                        }
                    } else {
                        throw new PackageNotFoundException(sprintf('Package `%s` not found.', $name));
                    }
                    $this->updateAutoloader();

                    return true;
                }
            }
        }

        return false;
    }

    protected function getPackage(
        RepositoryInterface $installedRepo,
        RepositoryInterface $repos,
        $name,
        $version = null
    ) {
        $name = strtolower($name);
        $constraint = null;
        if ($version) {
            $constraint = $this->versionParser->parseConstraints($version);
        }

        $policy = new DefaultPolicy();
        $pool = new Pool('dev');
        $pool->addRepository($repos);

        $matchedPackage = null;
        $versions = array();
        $matches = $pool->whatProvides($name, $constraint);
        foreach ($matches as $index => $package) {
            // skip providers/replacers
            if ($package->getName() !== $name) {
                unset($matches[$index]);
                continue;
            }

            // select an exact match if it is in the installed repo and no specific version was required
            if (null === $version && $installedRepo->hasPackage($package)) {
                $matchedPackage = $package;
            }

            $versions[$package->getPrettyVersion()] = $package->getVersion();
            $matches[$index] = $package->getId();
        }

        // select prefered package according to policy rules
        if (!$matchedPackage && $matches && $prefered = $policy->selectPreferedPackages($pool, array(), $matches)) {
            $matchedPackage = $pool->literalToPackage($prefered[0]);
        }

        return array($matchedPackage, $versions);
    }

    /**
     * @ApiDoc(
     *  section="Bundle/Package Manager",
     *  description="Installs a composer package and (optional) activates its containing bundle"
     * )
     *
     * @Rest\QueryParam(name="name", requirements=".+", strict=true, description="The composer package name")
     * @Rest\QueryParam(name="version", requirements=".+", strict=true, description="The version")
     * @Rest\QueryParam(name="withBundles", requirements=".+", default="false", description="If the containing bundle should be activated")
     *
     * @Rest\Post("/admin/system/bundle/manager/composer/install")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return string
     * @throws FileNotWritableException
     * @throws PackageNotFoundException
     */
    public function installComposerAction(ParamFetcher $paramFetcher)
    {
        $name = $paramFetcher->get('name');
        $version = $paramFetcher->get('version');
        $withBundles = filter_var($paramFetcher->get('withBundles'), FILTER_VALIDATE_BOOLEAN);

        if (!is_writeable($vendorDir = $this->getComposerVendorDir())) {
            throw new FileNotWritableException(sprintf('Directory `%s` is not writable.', $vendorDir));
        }

        $composer = $this->getComposer();

        //check if bundle exist
        $this->versionParser = new VersionParser();
        $platformRepo = new PlatformRepository();
        $localRepo = $composer->getRepositoryManager()->getLocalRepository();
        $installedRepo = new CompositeRepository(array($localRepo, $platformRepo));
        $repos = new CompositeRepository(array_merge(
            array($installedRepo),
            $composer->getRepositoryManager()->getRepositories()
        ));
        list($package, ) = $this->getPackage($installedRepo, $repos, $name, $version);

        if (!$package) {
            throw new PackageNotFoundException(sprintf(
                'Can not find package `%s` with version `%s`.',
                $name,
                $version
            ));
        }

        $fs = $this->getFileSystem();

        if ($fs->has('composer.json') && is_string($name)) {
            $composerJson = $fs->read('composer.json');
            if ($composerJson) {
                $composerJson = json_decode($composerJson, true);
                if (is_array($composerJson)) {
                    $found = false;
                    foreach ($composerJson['require'] as $key => $value) {
                        if (strtolower($key) == strtolower($name)) {
                            unset($composerJson['require'][$key]);
                            $found = $key;
                        }
                    }
                    if (!$found) {
                        $composerJson['require'][$name] = $version;
                        $fs->write('composer.json', json_format($composerJson));
                    } else {
                        $name = $found;
                    }
                }
            }
        }

        $install = Installer::create($this->composerIO, $composer);
        $install
            ->setVerbose(true)
            ->setPreferDist(true)
            ->setDevMode(true)
            ->setUpdate(true)
            ->setUpdateWhitelist([$name]);;

        if (filter_var($withBundles, FILTER_VALIDATE_BOOLEAN)) {
            $this->searchAndInstallBundles($this->getComposerVendorDir() . $name);
        }

        $this->updateAutoloader();

        return $this->composerIO->getOutput();
    }

    /**
     * @param string $path
     * @param bool $removeFiles
     */
    protected function searchAndUninstallBundlesAction($path, $removeFiles = false)
    {
        $bundles = $this->getBundlesFromPath($path);
        foreach ($bundles as $bundle) {
            if ($this->getJarves()->isActiveBundle($bundle)) {
                $this->uninstallAction($bundle, $removeFiles, true);
            }
        }
    }

    /**
     * @param string $path
     */
    protected function searchAndInstallBundles($path)
    {
        $bundles = $this->getBundlesFromPath($path);
        foreach ($bundles as $bundle) {
            $this->installAction($bundle, true);
        }
    }

    /**
     * @return Composer
     */
    private function getComposer()
    {
        putenv('COMPOSER_HOME=./');
        putenv('COMPOSER_CACHE_DIR=' . $this->getJarves()->getKernel()->getCacheDir());

        $this->composerIO = new BufferIO();
        $this->composer = Factory::create($this->composerIO);

        return $this->composer;
    }

    /**
     * @throws \Jarves\Exceptions\FileNotWritableException
     */
    protected function updateAutoloader()
    {
        if (!is_writeable($composerDir = $this->getComposerVendorDir() . 'composer/')) {
            throw new FileNotWritableException(sprintf('Directory `%s` is not writable.', $composerDir));
        }

        if (!is_writeable($autoload = $this->getComposerVendorDir() . 'autoload.php')) {
            throw new FileNotWritableException(sprintf('File `%s` is not writable.', $autoload));
        }

        $composer = $this->getComposer();
        $eventDispatcher = new EventDispatcher($composer, $this->composerIO);
        $autoloadGenerator = new AutoloadGenerator($eventDispatcher);
        $localRepo = $composer->getRepositoryManager()->getLocalRepository();

        $autoloadGenerator->dump(
            $composer->getConfig(),
            $localRepo,
            $composer->getPackage(),
            $composer->getInstallationManager(),
            'composer',
            true
        );
    }

    /**
     * Fires the script in module/$module/package/$script.php and its events.
     *
     * @param  string $bundle
     * @param  string $script
     *
     * @throws BundleNotFoundException
     * @return bool
     */
    protected function firePackageManager($bundleName, $script)
    {
        $bundle = $this->getJarves()->getBundle($bundleName);
        if ($bundle) {
            $namespace = $bundle->getNamespace();
        } else {
            if (class_exists($bundleName)) {
                $reflection = new \ReflectionClass($bundleName);
                $namespace = $reflection->getNamespaceName();
            } else {
                throw new BundleNotFoundException(sprintf('Bundle `%s` not found.', $bundleName));
            }
        }


        $packageManagerClass = $namespace . '\\PackageManger';

        if (class_exists($packageManagerClass)) {
            $packageManager = new $packageManagerClass($this->getJarves());
            if ($packageManager instanceof ContainerAwareInterface) {
                $packageManager->setContainer($this->getJarves()->getKernel()->getContainer());
            }

            if (method_exists($packageManager, $script)) {
                $packageManager->$script();
            } else {
                $this->getJarves()->getLogger()->debug(
                    sprintf('PackageManager of Bundle `%s` does not have the method `%s`', $bundle, $script)
                );
            }
        } else {
            $this->getJarves()->getLogger()->debug(
                sprintf('PackageManager class `%s` of Bundle `%s` does not exist', $packageManagerClass, $bundleName)
            );
        }

        return true;
    }

}
