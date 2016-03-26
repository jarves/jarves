<?php

namespace Jarves\Translation;

use Jarves\Controller;
use Jarves\Exceptions\FileNotWritableException;
use Symfony\Component\DependencyInjection\ContainerAwareInterface;
use Symfony\Component\Finder\Finder;

class Utils extends Controller
{
    public static $extractTranslations;

    public function getPluralForm($lang, $onlyAlgorithm = false)
    {
        //csv based on (c) http://translate.sourceforge.net/wiki/l10n/pluralforms
        $file = $this->getJarves()->resolvePath('@JarvesBundle/Resources/package/gettext-plural-forms.csv');
        if (!file_exists($file)) {
            return false;
        }

        $fh = fopen($file, 'r');
        if (!$fh) {
            return false;
        }
        $result = '';
        while (($buffer = fgetcsv($fh, 1000)) !== false) {

            if ($buffer[0] == $lang) {
                fclose($fh);
                $result = $buffer[2];
                break;
            }
        }

        if ($onlyAlgorithm) {
            $pos = strpos($result, 'plural=');

            return substr($result, $pos + 7);
        } else {
            return $result;
        }
    }

    public function parsePo($file)
    {
        $res = array('header' => array(), 'translations' => array(), 'file' => $file);
        if (!file_exists($file)) {
            return $res;
        }

        $lastPluralId = $lastId = $lastWasPlural = $inHeader = $nextIsThisContext = null;

        $fh = fopen($file, 'r');

        while (($buffer = fgets($fh)) !== false) {
            if (preg_match('/^msgctxt "(((\\\\.)|[^"])*)"/', $buffer, $match)) {
                $lastWasPlural = false;
                $nextIsThisContext = $match[1];
            }

            if (preg_match('/^msgid "(((\\\\.)|[^"])*)"/', $buffer, $match)) {
                $lastWasPlural = false;
                if ($match[1] == '') {
                    $inHeader = true;
                } else {
                    $inHeader = false;
                    $lastId = $match[1];
                    if ($nextIsThisContext) {
                        $lastId = $nextIsThisContext . "\004" . $lastId;
                        $nextIsThisContext = false;
                    }

                }
            }

            if (preg_match('/^msgstr "(((\\\\.)|[^"])*)"/', $buffer, $match)) {
                if ($inHeader == false) {
                    $lastWasPlural = false;
                    $res['translations'][static::evalString($lastId)] = static::evalString($match[1]);
                }
            }

            if (preg_match('/^msgid_plural "(((\\\\.)|[^"])*)"/', $buffer, $match)) {
                if ($inHeader == false) {
                    $lastWasPlural = true;
                    $res['plurals'][static::evalString($lastId)] = static::evalString($match[1]);
                }
            }

            if (preg_match('/^msgstr\[([0-9]+)\] "(((\\\\.)|[^"])*)"/', $buffer, $match)) {
                if ($inHeader == false) {
                    $lastPluralId = intval($match[1]);
                    $res['translations'][static::evalString($lastId)][$lastPluralId] = static::evalString($match[2]);
                }
            }

            if (preg_match('/^"(((\\\\.)|[^"])*)"/', $buffer, $match)) {
                if ($inHeader == true) {
                    $fp = strpos($match[1], ': ');
                    $res['header'][substr($match[1], 0, $fp)] = str_replace('\n', '', substr($match[1], $fp + 2));
                } else {
                    if (is_array($res['translations'][$lastId])) {
                        $res['translations'][static::evalString($lastId)][$lastPluralId] .= static::evalString($match[1]);
                    } else {
                        if ($lastWasPlural) {
                            $res['plurals'][static::evalString($lastId)] .= static::evalString($match[1]);
                        } else {
                            $res['translations'][static::evalString($lastId)] .= static::evalString($match[1]);
                        }
                    }
                }
            }

        }

        return $res;
    }

    /**
     * @param string $bundle
     * @param string $lang
     * @param array  $translation
     * @return bool
     * @throws FileNotWritableException
     */
    public function saveLanguage($bundle, $lang, $translation)
    {
        $file = $this->getJarves()->resolvePath("@$bundle/$lang.po", 'Resources/translations');

        @mkdir(dirname($file), 777, true);

        if (!is_writable($file)) {
            throw new FileNotWritableException(sprintf('File `%s` is not writable.', $file));
        }

        $translations = json_decode($translation, true);
        $current = $this->parsePo($file);

        $fh = fopen($file, 'w');

        if ($fh == false) {
            return false;
        }

        $pluralForms = $this->getPluralForm($lang) ?: 'nplurals=2; plural=(n!=1);';

        if ($current) {
            $current['header']['Plural-Forms'] = $pluralForms;
            $current['header']['PO-Revision-Date'] = date('Y-m-d H:iO');

            fwrite($fh, 'msgid ""' . "\n" . 'msgstr ""' . "\n");

            foreach ($current['header'] as $k => $v) {
                fwrite($fh, '"' . $k . ': ' . $v . '\n"' . "\n");
            }
            fwrite($fh, "\n\n");

        } else {

            //write initial header
            fwrite(
                $fh,
                '
               msgid ""
               msgstr ""
               "Project-Id-Version: Jarves cms - ' . $bundle . '\n"
"PO-Revision-Date: ' . date('Y-m-d H:iO') . '\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Language: ' . $lang . '\n"
"Plural-Forms: ' . $pluralForms . '\n"' . "\n\n"
            );

        }
        if (count($translations) > 0) {

            foreach ($translations as $key => $translation) {

                if (strpos($key, "\004") !== false) {
                    //we have a context
                    $context = self::toPoString(substr($key, 0, strpos($key, "\004")));
                    $id = self::toPoString(substr($key, strpos($key, "\004") + 1));
                    fwrite($fh, 'msgctxt ' . $context . "\n");
                    fwrite($fh, 'msgid ' . $id . "\n");
                } else {
                    fwrite($fh, 'msgid ' . self::toPoString($key) . "\n");
                }

                if (is_array($translation)) {

                    fwrite($fh, 'msgid_plural ' . self::toPoString($translation['plural']) . "\n");
                    unset($translation['plural']);

                    foreach ($translation as $k => $v) {
                        fwrite($fh, 'msgstr[' . $k . '] ' . self::toPoString($v) . "\n");
                    }

                } else {
                    fwrite($fh, 'msgstr ' . self::toPoString($translation) . "\n");
                }

                fwrite($fh, "\n");

            }

        }
        fclose($fh);

        $this->getJarves()->invalidateCache('core/lang');

        return true;

    }

    public static function toPoString($string)
    {
        $string = addcslashes($string, '"');
        $string = str_replace("\n", '\n"' . "\n" . '"', $string);
        $res = preg_replace('/([^\\\\])"/', '$1\"', $string);

        return '"' . $res . '"';
    }


    public function extractLanguage($bundleName)
    {
        $root = realpath($this->getJarves()->getKernel()->getRootDir(). '/../');
        $bundleDir = $this->getJarves()->getBundleDir($bundleName);

        $translations = [];
        $translations = array_merge($translations, $this->readDirectory($bundleDir. 'Resources/views'));

        $files = Finder::create()
            ->files()
            ->in($root . '/' . $bundleDir)
            ->name('*.php');

        foreach ($files as $file) {
            $classPlain = file_get_contents($file);
            if (preg_match('/ extends ObjectCrud/', $classPlain)) {
                preg_match('/^\s*\t*class ([a-z0-9_]+)/mi', $classPlain, $className);
                if (isset($className[1]) && $className[1]){
                    preg_match('/\s*\t*namespace ([a-zA-Z0-9_\\\\]+)/', $classPlain, $namespace);
                    $className = (count($namespace) > 1 ? $namespace[1] . '\\' : '' ) . $className[1];
                    $classReflection = new \ReflectionClass($className);
                    if ($classReflection->isSubclassOf('Jarves\Admin\ObjectCrud')) {
                        $tempObj = new $className();
                        if ($tempObj instanceof ContainerAwareInterface) {
                            $tempObj->setContainer($this->getJarves()->getContainer());
                        }

                        $tempObj->initialize();
                        if ($tempObj->getColumns()) {
                            self::extractFrameworkFields($tempObj->getColumns());
                        }
                        if ($tempObj->getInitializedFields()) {
                            self::extractFrameworkFields($tempObj->getFields());
                        }
                    }
//                    if ($tempObj->tabFields) {
//                        foreach ($tempObj->tabFields as $key => $fields) {
//                            $GLOBALS['moduleTempLangs'][$key] = $key;
//                            self::extractFrameworkFields($fields);
//                        }
//                    }
                }
            }
        }

        unset($translations['']);

        return $translations;
    }

    public static function extractFrameworkFields($fields)
    {
        foreach ($fields as $field) {
            if (isset($field['label'])) {
                $GLOBALS['moduleTempLangs'][$field['label']] = $field['label'];
            }
            if (isset($field['desc'])) {
                $GLOBALS['moduleTempLangs'][$field['desc']] = $field['desc'];
            }
        }
    }

    public static function extractAdmin($admin)
    {
        if (is_array($admin)) {
            foreach ($admin as $key => $value) {
                if ($value['title']) {
                    $GLOBALS['moduleTempLangs'][$value['title']] = $value['title'];
                }
                if ($value['type'] == 'add' || $value['type'] == 'edit' || $value['type'] == 'list') {

                }
                if (is_array($value['childs'])) {
                    self::extractAdmin($value['childs']);
                }
            }
        }
    }

    public static function evalString($p)
    {
        return stripcslashes($p);
    }

    /*
     *
     * extracts the calls of the translation methods
     *
     * @params string $pFile
     */

    public function extractFile($file)
    {
        $content = file_get_contents($file);

        return $this->extractTranslations($content);
    }

    public function extractTranslations($content)
    {
        $regExs = array(

//            //t('asd'), _('asd')
//            '/[\s\(\)\.](_l|_|t)\(\s*"(((\\\\.)|[^"])*)"\s*\)/',
//            //t("asd"), _("asd")
//            "/[\s\(\)\.](_l|_|t)\(\s*'(((\\\\.)|[^'])*)'\s*\)/" => '[\Jarves\Lang::evalString($p[2])] = true',
//            //[[asd]]
//            "/(\[\[)([^\]]*)\]\]/",

            //->tc('context', 'translation')
//            "/->tc\(\s*'(((\\\\.)|[^'])*)'\s*,\s*'(((\\\\.)|[^'])*)'\s*\)/" => '[$p[1]."\004".$p[4]] = true',
//
//            //->tc("context", "translation")
//            '/->tc\(\s*"(((\\\\.)|[^"])*)"\s*,\s*"(((\\\\.)|[^"])*)"\s*\)/' => '[\Jarves\Translation\Utils::evalString($p[1]."\004".$p[4])] = true',
//
//            //->t("singular", "plural", $count, "context"
//            '/->t\(\s*"(((\\\\.)|[^"])*)"\s*,\s*"(((\\\\.)|[^"])*)"\s*,[^,]*,\s*"(((\\\\.)|[^"])*)"\s*\)/' => '[\Jarves\Translation\Utils::evalString($p[7]."\004".$p[1])] = array($p[1], $p[4])',
//
//            //->t('singular', 'plural', *, 'context'
//            "/->t\(\s*'(((\\\\.)|[^'])*)'\s*,\s*'(((\\\\.)|[^'])*)'\s*,[^,]*,\s*'(((\\\\.)|[^'])*)'\s*\)/" => '[$p[7]."\004".$p[1]] = array($p[1], $p[4])',
//
//            //->t("singular", "plural", $count)
//            '/->t\(\s*"(((\\\\.)|[^"])*)"\s*,\s*"(((\\\\.)|[^"])*)"\s*,[^\)]*\)/' => '[\Jarves\Translation\Utils::evalString($p[1])] = array($p[1], $p[4])',
//
//            //->t('singular', 'plural', $count)
//            "/->t\(\s*'(((\\\\.)|[^'])*)'\s*,\s*'(((\\\\.)|[^'])*)'\s*,[^\)]*\)/" => '[$p[1]] = array($p[1], $p[4])',
//
            //{{ t("singular", "plural", $count) }}
            '/\{\{\s*t\s*\("(((\\\\.)|[^"])*)"\s*,\s*"(((\\\\.)|[^"])*)"\s*,\s*[^\}"]*\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1])] = array($p[1], $p[4])',
            '/\{\{\s*t\s*\(\'(((\\\\.)|[^\'])*)\'\s*,\s*\'(((\\\\.)|[^\'])*)\'\s*,\s*[^\}\']*\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1])] = array($p[1], $p[4])',

            //{{ tc("context", "singular", "plural", $count) }}
            '/\{\{\s*tc\s*\("(((\\\\.)|[^"])*)"\s*,\s*"(((\\\\.)|[^"])*)"\s*,\s*"(((\\\\.)|[^"])*)"\s*,\s*[^\}"]*\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1]."\004".$p[4])] = array($p[4], $p[7])',
            '/\{\{\s*tc\s*\(\'(((\\\\.)|[^\'])*)\'\s*,\s*\'(((\\\\.)|[^\'])*)\'\s*,\s*\'(((\\\\.)|[^\'])*)\'\s*,\s*[^\}\']*\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1]."\004".$p[4])] = array($p[4], $p[7])',

            //{{ tc("context", "translation") }}
            '/\{\{\s*tc\s*\(\s*"(((\\\\.)|[^"])*)"\s*,\s*"(((\\\\.)|[^"])*)"\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1]."\004".$p[4])] = true',
            '/\{\{\s*tc\s*\(\s*\'(((\\\\.)|[^\'])*)\'\s*,\s*\'(((\\\\.)|[^\'])*)\'\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1]."\004".$p[4])] = true',

            //{{ t("context") }}
            '/\{\{\s*t\s*\(\s*"(((\\\\.)|[^"])*)"\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1])] = true',
            '/\{\{\s*t\s*\(\s*\'(((\\\\.)|[^\'])*)\'\s*\)\s*\}\}/' => '[\Jarves\Translation\Utils::evalString($p[1])] = true',
        );
        //$GLOBALS['moduleTempLangs'][$file] = true;

        \Jarves\Translation\Utils::$extractTranslations = [];
        foreach ($regExs as $regEx => $val) {
            $fn = '\\Jarves\\Translation\\Utils::$extractTranslations' . $val . ';';

            preg_replace_callback(
                $regEx . 'mu',
                create_function(
                    '$p',
                    $fn
                ),
                $content
            );
        }

        return \Jarves\Translation\Utils::$extractTranslations;
    }

    public function readDirectory($path)
    {
        $root = realpath($this->getJarves()->getKernel()->getRootDir().'/../');
        if (!file_exists($root .'/'. $path)) return;
        $h = opendir($root .'/'. $path);

        $result = [];
        while ($file = readdir($h)) {
            if ($file == '.' || $file == '..' || $file == '.svn') {
                continue;
            }
            if (is_dir($path . '/' . $file)) {
                $result = array_merge($result, $this->readDirectory($path . '/' . $file));
            } else {
                $result = array_merge($result, $this->extractFile($root . '/' . $path . '/' . $file));
            }
        }
        return $result;
    }

}