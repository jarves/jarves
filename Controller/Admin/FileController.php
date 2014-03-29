<?php

namespace Jarves\Controller\Admin;

use FOS\RestBundle\Request\ParamFetcher;
use Jarves\Controller;
use Jarves\Exceptions\AccessDeniedException;
use Jarves\Exceptions\FileNotFoundException;
use Jarves\Exceptions\FileUploadException;
use Jarves\Exceptions\InvalidArgumentException;
use Jarves\File\FileInfo;
use Jarves\File\FileSize;
use Jarves\Model\Base\FileQuery;
use FOS\RestBundle\Controller\Annotations as Rest;
use Jarves\Model\File;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Nelmio\ApiDocBundle\Annotation\ApiDoc;
use Symfony\Component\HttpFoundation\Response;

class FileController extends Controller
{
    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Removes a file or folder (recursively) in /web"
     * )
     *
     * @Rest\RequestParam(name="path", requirements=".+", strict=true, description="The file path")
     *
     * @Rest\Delete("/admin/file")
     *
     * @param string $path
     *
     * @return bool
     */
    public function deleteFileAction($path)
    {
        $this->checkAccess($path);
        if (!$file = $this->getJarves()->getWebFileSystem()->getFile($path)) {
            return false;
        }

        FileQuery::create()->filterByPath($path)->delete();

        if ($result = $this->getJarves()->getWebFileSystem()->remove($path)) {
            $this->newFeed($file, 'deleted', $path);
        }

        return $result;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Creates a file in /web"
     * )
     *
     * @Rest\RequestParam(name="path", requirements=".+", strict=true, description="The file path")
     * @Rest\RequestParam(name="content", requirements=".*", strict=false, description="The file content")
     *
     * @Rest\Put("/admin/file")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function createFileAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $content = $paramFetcher->get('content');
        $this->checkAccess($path);

        if ($this->getJarves()->getWebFileSystem()->has($path)) {
            return ['targetExists' => true];
        }

        $result = $this->getJarves()->getWebFileSystem()->write($path, $content);
        if ($result) {
            $this->newFeed($path, 'created');
        }

        return $result;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Moves a file in /web to $target in /web"
     * )
     *
     * @Rest\RequestParam(name="path", requirements=".+", strict=true, description="The file path")
     * @Rest\RequestParam(name="target", requirements=".*", strict=true, description="The target file path")
     * @Rest\RequestParam(name="overwrite", requirements=".*", default="false", description="If the target should be overwritten")
     *
     * @Rest\Post("/admin/file/move")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array|bool returns [targetExists => true] when the target exists and $overwrite=false, otherwise true/false.
     */
    public function moveFileAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $target = $paramFetcher->get('target');
        $overwrite = filter_var($paramFetcher->get('overwrite'), FILTER_VALIDATE_BOOLEAN);

        if (!$overwrite && $this->getJarves()->getWebFileSystem()->has($target)) {
            return ['targetExists' => true];
        }

        $this->checkAccess($path);
        $this->checkAccess($target);

        $this->newFeed($path, 'moved', sprintf('from %s to %s', $path, $target));
        $result = $this->getJarves()->getWebFileSystem()->move($path, $target);

        return $result;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Moves or copies files in /web to $target in /web"
     * )
     *
     * @Rest\RequestParam(name="files", requirements=".*", array=true, strict=true, description="The file paths")
     * @Rest\RequestParam(name="target", requirements=".*", strict=true, description="The target file path")
     * @Rest\RequestParam(name="overwrite", requirements=".*", strict=true, default="false", description="If the target should be overwritten")
     * @Rest\RequestParam(name="move", requirements=".*", strict=true, default="false", description="If files should be moved (cut&paste) or copied (copy&paste)")
     *
     * @Rest\Post("/admin/file/paste")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array|bool returns [targetExists => true] when a target exists and $overwrite=false, otherwise true/false.
     */
    public function pasteAction(ParamFetcher $paramFetcher)
    {
        $files = $paramFetcher->get('files');
        $target = $paramFetcher->get('target');
        $overwrite = filter_var($paramFetcher->get('overwrite'), FILTER_VALIDATE_BOOLEAN);
        $move = filter_var($paramFetcher->get('move'), FILTER_VALIDATE_BOOLEAN);

        $this->checkAccess($target);
        foreach ($files as $file) {
            $this->checkAccess($file);

            $newPath = $target . '/' . basename($file);
            if (!$overwrite && $this->getJarves()->getWebFileSystem()->has($newPath)) {
                return ['targetExists' => true];
            }

            $this->newFeed($file, $move ? 'moved': 'copied', sprintf('from %s to %s', $file, $newPath));
        }

        return $this->getJarves()->getWebFileSystem()->paste($files, $target, $move ? 'move' : 'copy');
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Creates a folder in /web"
     * )
     *
     * @Rest\RequestParam(name="path", requirements=".+", strict=true, description="The file path")
     *
     * @Rest\Put("/admin/file/dir")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function createFolderAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $this->checkAccess(dirname($path));

        if ($result = $this->getJarves()->getWebFileSystem()->mkdir($path)) {
            $this->newFeed($path, 'created', $path);
        }

        return $result;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Checks the file access"
     * )
     *
     * @param string $path
     * @param array $fields
     * @param string $method if falsy then 'checkUpdateExact'
     *
     * @throws FileNotFoundException
     * @throws AccessDeniedException
     */
    protected function checkAccess($path, $fields = null, $method = null)
    {
        $file = null;

        if ('/' !== substr($path, 0, 1)) {
            $path = '/' . $path;
        }

        try {
            $file = $this->getJarves()->getWebFileSystem()->getFile($path);
        } catch (FileNotFoundException $e) {
            while ('/' !== $path) {
                try {
                    $path = dirname($path);
                    $file = $this->getJarves()->getWebFileSystem()->getFile($path);
                } catch (FileNotFoundException $e) {
                }
            }
        }

        $method = $method ? 'check' . ucfirst($method) . 'Exact' : 'checkUpdateExact';

        if ($file && !$this->getJarves()->getACL()->$method(
                'jarves/file',
                array('id' => $file->getId()),
                $fields
            )
        ) {
            throw new AccessDeniedException(sprintf('No access to file `%s`', $path));
        }
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Prepares a file upload process"
     * )
     *
     * @Rest\RequestParam(name="path", requirements=".+", strict=true, description="The file path")
     * @Rest\RequestParam(name="name", requirements=".*", strict=true, description="The file path")
     * @Rest\RequestParam(name="overwrite", requirements=".*", default="false", description="If the target should be overwritten")
     * @Rest\RequestParam(name="autoRename", requirements=".*", default="false", description="If the target name should be autoRenamed ($name-n) when already exists")
     *
     * @Rest\Post("/admin/file/upload/prepare")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array[renamed => bool, name => string, exist => bool, ready => bool]
     */
    public function prepareUploadAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $name = $paramFetcher->get('name');
        $overwrite = filter_var($paramFetcher->get('overwrite'), FILTER_VALIDATE_BOOLEAN);
        $autoRename = filter_var($paramFetcher->get('autoRename'), FILTER_VALIDATE_BOOLEAN);

        $oriName = $name;
        $newPath = ($path == '/') ? '/' . $name : $path . '/' . $name;

        $overwrite = filter_var($overwrite, FILTER_VALIDATE_BOOLEAN);
        $autoRename = filter_var($autoRename, FILTER_VALIDATE_BOOLEAN);

        $this->checkAccess($path);

        $res = array();

        if ($name != $oriName) {
            $res['renamed'] = true;
            $res['name'] = $name;
        }

        $exist = $this->getJarves()->getWebFileSystem()->has($newPath);
        if ($exist && !$overwrite) {
            if ($autoRename) {
                //find new name
                $extension = '';
                $firstName = $oriName;
                $lastDot = strrpos($oriName, '.');
                if (false !== $lastDot) {
                    $firstName = substr($oriName, 0, $lastDot);
                    $extension = substr($oriName, $lastDot + 1);
                }

                $i = 0;
                do {
                    $i++;
                    $name = $firstName . '-' . $i . ($extension ? '.' . $extension : '');
                    $newPath = ($path == '/') ? '/' . $name : $path . '/' . $name;
                    if (!$this->getJarves()->getWebFileSystem()->has($newPath)) {
                        break;
                    }
                } while (true);

                $res['renamed'] = true;
                $res['name'] = $name;
            } else {
                $res['exist'] = true;

                return $res;
            }
        }

        $this->getJarves()->getWebFileSystem()->write(
            $newPath,
            "file-is-being-uploaded-by-" . hash('sha512', $this->getJarves()->getAdminClient()->getTokenId())
        );
        $res['ready'] = true;

        return $res;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Uploads a file to $path with $name as name"
     * )
     *
     * @Rest\RequestParam(name="path", requirements=".+", strict=true, description="The target path")
     * @Rest\RequestParam(name="name", requirements=".*", strict=false, description="The file name if you want a different")
     * @ #Rest\RequestParam(name="overwrite", requirements=".*", default="false", description="If the target should be overwritten")
     * @Rest\RequestParam(name="file", strict=false, description="The file")
     *
     * @Rest\Post("/admin/file/upload")
     *
     * @param Request $request
     * @param ParamFetcher $paramFetcher
     *
     * @return string
     * @throws FileUploadException
     * @throws InvalidArgumentException
     * @throws AccessDeniedException
     */
    public function doUploadAction(Request $request, ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $overwriteName = $paramFetcher->get('name');
//        $overwrite = filter_var($paramFetcher->get('overwrite'), FILTER_VALIDATE_BOOLEAN);

        /** @var $file UploadedFile */
        $file = $request->files->get('file');
        if (null == $file) {
            throw new InvalidArgumentException("There is no file uploaded.");
        }

        $name = $file->getClientOriginalName();
        if ($overwriteName) {
            $name = $overwriteName;
        }

        if ($file->getError()) {
            $error = sprintf(
                ('Failed to upload the file %s to %s. Error: %s'),
                $name,
                $path,
                $file->getErrorMessage()
            );
            throw new FileUploadException($error);
        }

        $newPath = ($path == '/') ? '/' . $name : $path . '/' . $name;
        if ($this->getJarves()->getWebFileSystem()->has($newPath)) {
//            if (!$overwrite) {
                if ($this->getJarves()->getWebFileSystem()->has($newPath)) {
                    $content = $this->getJarves()->getWebFileSystem()->read($newPath);

                    $check = "file-is-being-uploaded-by-" . hash('sha512', $this->getJarves()->getAdminClient()->getTokenId());
                    if ($content != $check) {
                        //not our file, so cancel
                        throw new FileUploadException(sprintf(
                            'The target file is currently being uploaded by someone else.'
                        ));
                    }
                } else {
                    throw new FileUploadException(sprintf('The target file has not be initialized.'));
                }
//            }
        }

        $jarvesFile = $this->getJarves()->getWebFileSystem()->getFile(dirname($path));
        if ($jarvesFile && !$this->getJarves()->getACL()->checkUpdate(
                'jarves/file',
                array('id' => $jarvesFile->getId())
            )
        ) {
            throw new AccessDeniedException(sprintf('No access to file `%s`', $path));
        }

        $content = file_get_contents($file->getPathname());
        $result = $this->getJarves()->getWebFileSystem()->write($newPath, $content);
        @unlink($file->getPathname());

        if ($result) {
            $this->newFeed($newPath, 'uploaded', 'to ' . $newPath);
        }

        return $newPath;
    }

    /**
     * @param string|File $path
     * @param string $verb
     * @param string $message
     */
    protected function newFeed($path, $verb, $message = '')
    {
        $file = $path;
        if (!($path instanceof File)) {
            $file = $this->getJarves()->getWebFileSystem()->getFile($path);
        }

        if ($file instanceof File) {
            $this->getJarves()->getUtils()->newNewsFeed(
                'jarves/file',
                $file->toArray(),
                $verb,
                $message
            );
        }
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Returns the content of the file. If $path is a directory it returns all containing files as array"
     * )
     *
     * @Rest\QueryParam(name="path", requirements=".+", strict=true, description="The file path or its ID")
     *
     * @Rest\Get("/admin/file")
     *
     * @param string $path
     *
     * @return array|null|string array for directory, string for file content, null if not found.
     */
    public function getContentAction($path)
    {
        if (!$file = $this->getFile($path)) {
            return null;
        }

        // todo: check for Read permission

        if ($file['type'] == 'dir') {
            return $this->getFiles($path);
        } else {
            return $this->getJarves()->getWebFileSystem()->read($path);
        }
    }

    /**
     * Returns a list of files for a folder.
     *
     * @param string $path
     *
     * @return array|null
     */
    protected function getFiles($path)
    {
        if (!$this->getFile($path)) {
            return null;
        }

        //todo, create new option 'show hidden files' in user settings and depend on that

        $files = $this->getJarves()->getWebFileSystem()->getFiles($path);

        return $this->prepareFiles($files);
    }

    /**
     * Adds 'writeAccess' and imageInformation to $files.
     *
     * @param FileInfo[] $files
     * @param bool $showHiddenFiles
     * @return array
     */
    protected function prepareFiles($files, $showHiddenFiles = false)
    {
        $result = [];

        $blacklistedFiles = array('/index.php' => 1, '/install.php' => 1);

        foreach ($files as $key => $file) {
            $file = $file->toArray();
            if (!$this->getJarves()->getACL()->checkListExact(
                'jarves/file',
                array('id' => $file['id']))
            ) {
                continue;
            }

            if (isset($blacklistedFiles[$file['path']]) | (!$showHiddenFiles && substr($file['name'], 0, 1) == '.')) {
                continue;
            } else {
                $file['writeAccess'] = $this->getJarves()->getACL()->checkUpdateExact(
                    'jarves/file',
                    array('id' => $file['id'])
                );
                $this->appendImageInformation($file);
            }
            $result[] = $file;
        }

        return $result;
    }

    /**
     * Adds image information (dimensions/imageType).
     *
     * @param array $file
     */
    protected function appendImageInformation(&$file)
    {
        $imageTypes = array('jpg', 'jpeg', 'png', 'bmp', 'gif');

        if (array_search($file['extension'], $imageTypes) !== false) {
            $content = $this->getJarves()->getWebFileSystem()->read($file['path']);

            $size = new FileSize();
            $size->setHandleFromBinary($content);

            $file['imageType'] = $size->getType();
            $size = $size->getSize();
            if ($size) {
                $file['dimensions'] = ['width' => $size[0], 'height' => $size[1]];
            }
        }
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Searches for files"
     * )
     *
     * @Rest\QueryParam(name="path", requirements=".+", strict=true, description="The target path")
     * @Rest\QueryParam(name="q", requirements=".*", strict=true, description="Search query")
     * @Rest\QueryParam(name="depth", requirements="[0-9]+", default=1, description="Depth")
     *
     * @Rest\Get("/admin/file/search")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array
     */
    public function searchAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $q = $paramFetcher->get('q');
        $depth = $paramFetcher->get('depth');

        $files = $this->getJarves()->getWebFileSystem()->search($path, $q, $depth);

        return $this->prepareFiles($files);
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Gets information about a single file"
     * )
     *
     * @Rest\QueryParam(name="path", requirements=".+", strict=true, description="The file path or its ID")
     *
     * @Rest\Get("/admin/file/single")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return array|null null if not found or not access
     */
    public function getFileAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');

        return $this->getFile($path);
    }

    /**
     * Returns file information as array.
     *
     * @param string|integer $path
     * @return array|null
     */
    protected function getFile($path)
    {
        $file = $this->getJarves()->getWebFileSystem()->getFile($path);
        if (!$file || !$this->getJarves()->getACL()->checkListExact('jarves/file', array('id' => $file->getId()))) {
            return null;
        }

        $file = $file->toArray();
        $file['writeAccess'] = $this->getJarves()->getACL()->checkUpdateExact('jarves/file', $file['id']);

        $this->appendImageInformation($file);

        return $file;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Displays a thumbnail/resized version of a image"
     * )
     *
     * This exists the process and sends a `content-type: image/png` http header.
     *
     * @Rest\QueryParam(name="path", requirements=".+", strict=true, description="The file path or its ID")
     * @Rest\QueryParam(name="width", requirements="[0-9]+", default=50, description="The image width")
     * @Rest\QueryParam(name="height", requirements="[0-9]*", default=50, description="The image height")
     *
     * @Rest\Get("/admin/file/preview")
     *
     * @param ParamFetcher $paramFetcher
     */
    public function showPreviewAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $width = $paramFetcher->get('width');
        $height = $paramFetcher->get('height');

        if (is_numeric($path)) {
            $path = $this->getJarves()->getWebFileSystem()->getPath($path);
        }

        $this->checkAccess($path, null, 'view');
        $file = $this->getJarves()->getWebFileSystem()->getFile($path);
        if ($file->isDir()) {
            return;
        }

        $ifModifiedSince = $this->getJarves()->getRequest()->headers->get('If-Modified-Since');
        if (isset($ifModifiedSince) && (strtotime($ifModifiedSince) == $file->getModifiedTime())) {
            // Client's cache IS current, so we just respond '304 Not Modified'.

            $response = new Response();
            $response->setStatusCode(304);
            $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $file->getModifiedTime()).' GMT');
            return $response;
        }

        $image = $this->getJarves()->getWebFileSystem()->getResizeMax($path, $width, $height);


        $expires = 3600; //1 h
        $response = new Response();
        $response->headers->set('Content-Type', 'image/png');
        $response->headers->set('Pragma', 'public');
        $response->headers->set('Cache-Control', 'max-age=' . $expires);
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $file->getModifiedTime()) . ' GMT');
        $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');

        ob_start();
        imagepng($image->getResult(), null, 8);
        $imageData = ob_get_contents();
        ob_end_clean();

        $response->setContent($imageData);
        return $response;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Views the file content directly in the browser with a proper Content-Type and cache headers"
     * )
     *
     * Views the file content directly in the browser with a proper Content-Type and cache headers.
     *
     * @Rest\QueryParam(name="path", requirements=".+", strict=true, description="The file path or its ID")
     *
     * @Rest\Get("/admin/file/content")
     *
     * @param ParamFetcher $paramFetcher
     */
    public function viewFileAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');

        if (is_numeric($path)) {
            $path = $this->getJarves()->getWebFileSystem()->getPath($path);
        }
        $this->checkAccess($path, null, 'view');

        $file = $this->getJarves()->getWebFileSystem()->getFile($path);
        if ($file->isDir()) {
            return;
        }

        $ifModifiedSince = $this->getJarves()->getRequest()->headers->get('If-Modified-Since');
        if (isset($ifModifiedSince) && (strtotime($ifModifiedSince) == $file->getModifiedTime())) {
            // Client's cache IS current, so we just respond '304 Not Modified'.
            $response = new Response();
            $response->setStatusCode(304);
            $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $file->getModifiedTime()).' GMT');
            return $response;
        }

        $content = $this->getJarves()->getWebFileSystem()->read($path);
        $mime = $file->getMimeType();

        $expires = 3600; //1 h
        $response = new Response();
        $response->headers->set('Content-Type', $mime);
        $response->headers->set('Pragma', 'public');
        $response->headers->set('Cache-Control', 'max-age=' . $expires);
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $file->getModifiedTime()) . ' GMT');
        $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');

        $response->setContent($content);
        return $response;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Saves the file content"
     * )
     *
     * @Rest\RequestParam(name="path", requirements=".+", strict=true, description="The file path or its ID")
     * @Rest\RequestParam(name="contentEncoding", requirements="plain|base64", default="plain", description="The $content contentEncoding.")
     * @Rest\RequestParam(name="content", description="The file content")
     *
     * @Rest\Post("/admin/file/content")
     *
     * @param ParamFetcher $paramFetcher
     *
     * @return bool
     */
    public function setContentAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');
        $content = $paramFetcher->get('content');
        $contentEncoding = $paramFetcher->get('contentEncoding');

        $this->checkAccess($path);
        if ('base64' === $contentEncoding) {
            $content = base64_decode($content);
        }

        if ($result = $this->getJarves()->getWebFileSystem()->write($path, $content)) {
            $this->newFeed($path, 'changed content of');
        }

        return $result;
    }

    /**
     * @ApiDoc(
     *  section="File Manager",
     *  description="Displays a (complete) image (with cache-headers)"
     * )
     *
     * @Rest\QueryParam(name="path", requirements=".+", strict=true, description="The file path or its ID")
     *
     * @Rest\Get("/admin/file/image")
     *
     * @param ParamFetcher $paramFetcher
     */
    public function showImageAction(ParamFetcher $paramFetcher)
    {
        $path = $paramFetcher->get('path');

        if (is_numeric($path)) {
            $path = $this->getJarves()->getWebFileSystem()->getPath($path);
        }

        $this->checkAccess($path, null, 'view');
        $file = $this->getJarves()->getWebFileSystem()->getFile($path);
        if ($file->isDir()) {
            return;
        }

        $ifModifiedSince = $this->getJarves()->getRequest()->headers->get('If-Modified-Since');
        if (isset($ifModifiedSince) && (strtotime($ifModifiedSince) == $file->getModifiedTime())) {
            // Client's cache IS current, so we just respond '304 Not Modified'.
            $response = new Response();
            $response->setStatusCode(304);
            $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $file->getModifiedTime()).' GMT');
            return $response;
        }

        $content = $this->getJarves()->getWebFileSystem()->read($path);
        $image = \PHPImageWorkshop\ImageWorkshop::initFromString($content);

        $result = $image->getResult();

        $size = new FileSize();
        $size->setHandleFromBinary($content);


        $expires = 3600; //1 h
        $response = new Response();
        $response->headers->set('Content-Type', 'png' == $size->getType() ? 'image/png' : 'image/jpeg');
        $response->headers->set('Pragma', 'public');
        $response->headers->set('Cache-Control', 'max-age=' . $expires);
        $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s', $file->getModifiedTime()) . ' GMT');
        $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $expires) . ' GMT');

        ob_start();

        if ('png' === $size->getType()) {
            imagepng($result, null, 3);
        } else {
            imagejpeg($result, null, 100);
        }

        $response->setContent(ob_get_contents());
        ob_end_clean();

        return $response;
    }

}
