<?php

namespace ApplicationTest\Controller;

use Application\Model\FormFlowChecker;
use Mockery;
use RuntimeException;
use Laminas\Http\Response;
use Laminas\Mvc\MvcEvent;
use Laminas\Router\RouteMatch;
use Laminas\View\Model\ViewModel;

class AbstractLpaControllerTest extends AbstractControllerTest
{
    public function testOnDispatchNotAuthenticated()
    {
        $this->setIdentity(null);

        $controller = $this->getController(TestableAbstractLpaController::class);

        $response = new Response();
        $event = new MvcEvent();

        $this->request->shouldReceive('getUri')->andReturn('http://localhost/home');
        $this->redirect->shouldReceive('toRoute')
            ->withArgs(['login', ['state' => 'timeout']])->andReturn($response)->once();

        $result = $controller->onDispatch($event);

        $this->assertEquals($result, $response);
    }

    public function testOnDispatchNoLpaException()
    {
        $this->lpa = false;

        $controller = $this->getController(TestableAbstractLpaController::class);

        $response = new Response();
        $event = Mockery::mock(MvcEvent::class);
        $controller->setEvent($event);

        $routeMatch = Mockery::mock(RouteMatch::class);
        $event->shouldReceive('getRouteMatch')->andReturn($routeMatch);
        $event->shouldReceive('getResponse')->andReturn($response);
        $routeMatch->shouldReceive('setParam')->withArgs(['action', 'not-found'])->andReturn(null)->once();

        $result = $controller->onDispatch($event);

        $this->assertEquals(404, $response->getStatusCode());
        $this->assertEquals('Page not found', $result->content);
    }

    public function testOnDispatchNoMethod()
    {
        $controller = $this->getController(TestableAbstractLpaController::class);

        $response = new Response();
        $controller->dispatch($this->request, $response);
        $event = Mockery::mock(MvcEvent::class);

        $this->layout->shouldReceive('__invoke')->andReturn($this->layout)->once();
        $routeMatch = Mockery::mock(RouteMatch::class);
        $event->shouldReceive('getRouteMatch')->andReturn($routeMatch)->twice();
        $routeMatch->shouldReceive('getMatchedRouteName')->andReturn('lpa/unknown')->once();
        $routeMatch->shouldReceive('getParam')->withArgs(['idx'])->andReturn(null)->once();
        $flowChecker = Mockery::mock(FormFlowChecker::class);
        $controller->injectedFlowChecker = $flowChecker;
        $flowChecker->shouldReceive('getNearestAccessibleRoute')
            ->withArgs(['lpa/unknown', null])->andReturn(false)->once();

        $result = $controller->onDispatch($event);

        $this->assertEquals($result, $response);
    }

    public function testOnDispatchCalculatedRouteNotEqual()
    {
        $controller = $this->getController(TestableAbstractLpaController::class);

        $response = new Response();
        $event = Mockery::mock(MvcEvent::class);

        $this->layout->shouldReceive('__invoke')->andReturn($this->layout)->once();
        $routeMatch = Mockery::mock(RouteMatch::class);
        $event->shouldReceive('getRouteMatch')->andReturn($routeMatch)->twice();
        $routeMatch->shouldReceive('getMatchedRouteName')->andReturn('lpa/donor')->once();
        $routeMatch->shouldReceive('getParam')->withArgs(['idx'])->andReturn(null)->once();
        $flowChecker = Mockery::mock(FormFlowChecker::class);
        $controller->injectedFlowChecker = $flowChecker;
        $flowChecker->shouldReceive('getNearestAccessibleRoute')
            ->withArgs(['lpa/donor', null])->andReturn('lpa/checkout')->once();
        $flowChecker->shouldReceive('getRouteOptions')->withArgs(['lpa/checkout'])->andReturn([])->once();
        $this->redirect->shouldReceive('toRoute')
            ->withArgs(['lpa/checkout', ['lpa-id' => $this->lpa->id], []])->andReturn($response)->once();

        $result = $controller->onDispatch($event);

        $this->assertEquals($result, $response);
    }

    public function testOnDispatchDownload()
    {
        $controller = $this->getController(TestableAbstractLpaController::class);

        $event = Mockery::mock(MvcEvent::class);

        $this->layout->shouldReceive('__invoke')->andReturn($this->layout)->once();
        $routeMatch = Mockery::mock(RouteMatch::class);
        $event->shouldReceive('getRouteMatch')->andReturn($routeMatch)->times(3);
        $routeMatch->shouldReceive('getMatchedRouteName')->andReturn('lpa/download')->once();
        $routeMatch->shouldReceive('getParam')->withArgs(['pdf-type'])->andReturn('lp1')->once();
        $flowChecker = Mockery::mock(FormFlowChecker::class);
        $controller->injectedFlowChecker = $flowChecker;
        $flowChecker->shouldReceive('getNearestAccessibleRoute')
            ->withArgs(['lpa/download', 'lp1'])->andReturn('lpa/download')->once();
        $this->logger->shouldReceive('info')->withArgs([
            'Request to ApplicationTest\Controller\TestableAbstractLpaController',
            $this->userIdentity->toArray()
        ])->once();
        $this->userDetailsSession->user = $this->user;
        $routeMatch->shouldReceive('getParam')
            ->withArgs(['action', 'not-found'])->andReturn('index')->once();
        $event->shouldReceive('setResult')->once();

        /** @var ViewModel $result */
        $result = $controller->onDispatch($event);

        $this->assertInstanceOf(ViewModel::class, $result);
        $this->assertEquals('', $result->getTemplate());
        $this->assertEquals('Placeholder page', $result->content);
    }

    public function testMoveToNextRouteNotRouteMatch()
    {
        $controller = $this->getController(TestableAbstractLpaController::class);

        $this->request->shouldReceive('isXmlHttpRequest')->andReturn(false)->once();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage(
            'RouteMatch must be an instance of Laminas\Router\Http\RouteMatch for moveToNextRoute()'
        );

        $controller->testMoveToNextRoute();
    }
}
