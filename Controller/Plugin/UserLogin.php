<?php

namespace Jarves\Controller\Plugin;

use Jarves\Jarves;
use Jarves\Model\User;
use Jarves\PageStack;
use Jarves\PluginController;
use Jarves\PluginResponse;
use Symfony\Bundle\FrameworkBundle\Templating\EngineInterface;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormFactory;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class UserLogin extends PluginController
{
    /**
     * @var EngineInterface
     */
    protected $templating;

    /**
     * @var PageStack
     */
    private $pageStack;

    /**
     * @var FormFactory
     */
    private $formFactory;

    /**
     * @param EngineInterface $templating
     * @param PageStack $pageStack
     * @param FormFactory $formFactory
     */
    public function __construct(EngineInterface $templating, PageStack $pageStack, FormFactory $formFactory)
    {
        $this->templating = $templating;
        $this->pageStack = $pageStack;
        $this->formFactory = $formFactory;
    }

    public function loginForm()
    {
        if ($this->pageStack->getClient()->isLoggedIn()) {
            return $this->templating->renderResponse('JarvesBundle:User:logout.html.twig');
        }

        return $this->templating->renderResponse('JarvesBundle:User:login.html.twig');
    }

    public function registerForm(Request $request)
    {
        if ($this->pageStack->getClient()->isLoggedIn()) {
            return $this->templating->renderResponse('JarvesBundle:User:logout.html.twig');
        }

        $user = new User();

        $form = $this->formFactory->createBuilder()
            ->setData($user)
            ->add('email', EmailType::class)
            ->add('password', PasswordType::class)
            ->add('save', SubmitType::class, array('label' => 'Register'))
            ->getForm();

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {

        }

        return $this->templating->renderResponse('JarvesBundle:User:register.html.twig', [
            'form' => $form->createView()
        ]);
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function doLogin(Request $request)
    {
        $success = $this->pageStack->getClient()->login($request->request->get('email'), $request->request->get('password'));

        return RedirectResponse::create($this->pageStack->getCurrentUrl() . '?success=' . ($success ? 1 : 0));
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function doLogout()
    {
        $this->pageStack->getClient()->logout();

        return RedirectResponse::create($this->pageStack->getCurrentUrl());
    }
}