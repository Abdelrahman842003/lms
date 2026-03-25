<?php

declare(strict_types=1);

namespace Tests\Unit\Notifications\Observers;

use App\Domains\Auth\Models\Student;
use App\Domains\Notifications\Events\NotificationSentEvent;
use App\Domains\Notifications\Listeners\NotificationEventSubscriber;
use App\Domains\Notifications\Observers\AnalyticsChannelObserver;
use App\Domains\Notifications\Observers\BroadcastChannelObserver;
use App\Domains\Notifications\Observers\DatabaseChannelObserver;
use App\Domains\Notifications\Observers\FcmChannelObserver;
use App\Domains\Notifications\Observers\NotificationChannelObserverInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Test suite for the Observer Pattern implementation in Notifications.
 * 
 * @see https://refactoring.guru/design-patterns/observer
 */
class NotificationObserverTest extends TestCase
{
    use RefreshDatabase, MockeryPHPUnitIntegration;

    private function createStudent(): Student
    {
        return Student::factory()->make(['id' => 1]);
    }

    private function createEvent(array $overrides = []): NotificationSentEvent
    {
        return new NotificationSentEvent(
            notificationId: $overrides['notificationId'] ?? 'test-uuid-123',
            notifiable: $overrides['notifiable'] ?? $this->createStudent(),
            userType: $overrides['userType'] ?? 'student',
            title: $overrides['title'] ?? 'Test Title',
            message: $overrides['message'] ?? 'Test Message',
            data: $overrides['data'] ?? [],
            type: $overrides['type'] ?? 'general',
            channels: $overrides['channels'] ?? ['database', 'broadcast'],
            fcmSent: $overrides['fcmSent'] ?? false
        );
    }

    #[Test]
    public function notification_sent_event_contains_required_data(): void
    {
        $student = $this->createStudent();
        $event = $this->createEvent([
            'notificationId' => 'test-uuid-123',
            'notifiable' => $student,
            'userType' => 'student',
            'title' => 'Test Title',
            'message' => 'Test Message',
            'data' => ['key' => 'value'],
            'type' => 'general',
            'channels' => ['database', 'broadcast'],
            'fcmSent' => false
        ]);

        $this->assertEquals('test-uuid-123', $event->notificationId);
        $this->assertEquals('student', $event->userType);
        $this->assertEquals('Test Title', $event->title);
        $this->assertEquals('Test Message', $event->message);
        $this->assertEquals(['key' => 'value'], $event->data);
        $this->assertEquals('general', $event->type);
        $this->assertEquals(['database', 'broadcast'], $event->channels);
        $this->assertFalse($event->fcmSent);
    }

    #[Test]
    public function event_can_check_if_sent_via_specific_channel(): void
    {
        $event = $this->createEvent([
            'channels' => ['database', 'broadcast', 'fcm'],
            'fcmSent' => true
        ]);

        $this->assertTrue($event->wasSentVia('database'));
        $this->assertTrue($event->wasSentVia('broadcast'));
        $this->assertTrue($event->wasSentVia('fcm'));
        $this->assertFalse($event->wasSentVia('mail'));
    }

    #[Test]
    public function event_can_get_notifiable_id(): void
    {
        $student = Student::factory()->make(['id' => 42]);
        $event = $this->createEvent(['notifiable' => $student]);

        $this->assertEquals(42, $event->getNotifiableId());
    }

    #[Test]
    public function database_observer_handles_database_channel(): void
    {
        $observer = new DatabaseChannelObserver();
        
        $eventWithDatabase = $this->createEvent(['channels' => ['database']]);
        $eventWithoutDatabase = $this->createEvent(['channels' => ['broadcast']]);

        $this->assertTrue($observer->shouldHandle($eventWithDatabase));
        $this->assertFalse($observer->shouldHandle($eventWithoutDatabase));
    }

    #[Test]
    public function broadcast_observer_handles_broadcast_channel(): void
    {
        $observer = new BroadcastChannelObserver();
        
        $eventWithBroadcast = $this->createEvent(['channels' => ['broadcast']]);
        $eventWithoutBroadcast = $this->createEvent(['channels' => ['database']]);

        $this->assertTrue($observer->shouldHandle($eventWithBroadcast));
        $this->assertFalse($observer->shouldHandle($eventWithoutBroadcast));
    }

    #[Test]
    public function fcm_observer_handles_fcm_channel_when_fcm_is_sent(): void
    {
        $observer = new FcmChannelObserver();
        
        $eventWithFcm = $this->createEvent([
            'channels' => ['fcm'],
            'fcmSent' => true
        ]);

        $eventWithoutFcm = $this->createEvent([
            'channels' => ['fcm'],
            'fcmSent' => false
        ]);

        $eventFcmNotInChannels = $this->createEvent([
            'channels' => ['database'],
            'fcmSent' => true
        ]);

        $this->assertTrue($observer->shouldHandle($eventWithFcm));
        $this->assertFalse($observer->shouldHandle($eventWithoutFcm));
        $this->assertFalse($observer->shouldHandle($eventFcmNotInChannels));
    }

    #[Test]
    public function analytics_observer_handles_all_events(): void
    {
        $observer = new AnalyticsChannelObserver();
        
        $event = $this->createEvent();

        $this->assertTrue($observer->shouldHandle($event));
    }

    #[Test]
    public function subscriber_registers_default_observers(): void
    {
        $subscriber = new NotificationEventSubscriber();
        $observers = $subscriber->getObservers();

        $this->assertCount(4, $observers);
        
        $observerTypes = array_map(fn($o) => get_class($o), $observers);
        $this->assertContains(DatabaseChannelObserver::class, $observerTypes);
        $this->assertContains(BroadcastChannelObserver::class, $observerTypes);
        $this->assertContains(FcmChannelObserver::class, $observerTypes);
        $this->assertContains(AnalyticsChannelObserver::class, $observerTypes);
    }

    #[Test]
    public function subscriber_can_register_additional_observers(): void
    {
        $subscriber = new NotificationEventSubscriber();
        $customObserver = new class implements NotificationChannelObserverInterface {
            public function handle(NotificationSentEvent $event): void {}
            public function shouldHandle(NotificationSentEvent $event): bool { return true; }
        };

        $subscriber->registerObserver($customObserver);
        $observers = $subscriber->getObservers();

        $this->assertCount(5, $observers);
        $this->assertContains($customObserver, $observers);
    }

    #[Test]
    public function subscriber_can_remove_observers(): void
    {
        $subscriber = new NotificationEventSubscriber();
        $customObserver = new class implements NotificationChannelObserverInterface {
            public function handle(NotificationSentEvent $event): void {}
            public function shouldHandle(NotificationSentEvent $event): bool { return true; }
        };

        $subscriber->registerObserver($customObserver);
        $this->assertCount(5, $subscriber->getObservers());

        $subscriber->removeObserver($customObserver);
        $this->assertCount(4, $subscriber->getObservers());
    }

    #[Test]
    public function subscriber_notifies_all_eligible_observers(): void
    {
        $subscriber = new NotificationEventSubscriber();
        
        $event = $this->createEvent([
            'channels' => ['database', 'broadcast'],
            'fcmSent' => false
        ]);

        // Each observer that shouldHandle returns true will be called
        // We're testing that the subscriber iterates through all observers
        $handledCount = 0;
        
        $mockObserver = Mockery::mock(NotificationChannelObserverInterface::class);
        $mockObserver->shouldReceive('shouldHandle')
            ->once()
            ->andReturn(true);
        $mockObserver->shouldReceive('handle')
            ->once()
            ->andReturnUsing(function () use (&$handledCount) {
                $handledCount++;
            });

        $subscriber->registerObserver($mockObserver);
        $subscriber->handleNotificationSent($event);

        $this->assertEquals(1, $handledCount);
    }

    #[Test]
    public function subscriber_skips_observers_that_should_not_handle(): void
    {
        $subscriber = new NotificationEventSubscriber();
        
        $event = $this->createEvent();

        $mockObserver = Mockery::mock(NotificationChannelObserverInterface::class);
        $mockObserver->shouldReceive('shouldHandle')
            ->once()
            ->andReturn(false);
        $mockObserver->shouldNotReceive('handle');

        $subscriber->registerObserver($mockObserver);
        $subscriber->handleNotificationSent($event);
    }

    #[Test]
    public function subscriber_subscribes_to_notification_sent_event(): void
    {
        $subscriber = new NotificationEventSubscriber();
        $events = app('events');
        
        $subscriptions = $subscriber->subscribe($events);

        $this->assertArrayHasKey(NotificationSentEvent::class, $subscriptions);
        $this->assertEquals('handleNotificationSent', $subscriptions[NotificationSentEvent::class]);
    }

    public static function channelDataProvider(): array
    {
        return [
            'database only' => [['database'], true, false, false],
            'broadcast only' => [['broadcast'], false, true, false],
            'fcm only' => [['fcm'], false, false, true],
            'all channels' => [['database', 'broadcast', 'fcm'], true, true, true],
            'database and broadcast' => [['database', 'broadcast'], true, true, false],
        ];
    }

    #[Test]
    #[DataProvider('channelDataProvider')]
    public function observers_respond_to_correct_channels(
        array $channels,
        bool $expectDatabase,
        bool $expectBroadcast,
        bool $expectFcm
    ): void {
        $event = $this->createEvent([
            'channels' => $channels,
            'fcmSent' => $expectFcm
        ]);

        $databaseObserver = new DatabaseChannelObserver();
        $broadcastObserver = new BroadcastChannelObserver();
        $fcmObserver = new FcmChannelObserver();

        $this->assertEquals($expectDatabase, $databaseObserver->shouldHandle($event));
        $this->assertEquals($expectBroadcast, $broadcastObserver->shouldHandle($event));
        $this->assertEquals($expectFcm, $fcmObserver->shouldHandle($event));
    }
}
