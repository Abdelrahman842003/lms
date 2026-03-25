<?php

declare(strict_types=1);

namespace Tests\Unit\Enrollments\States;

use App\Domains\Enrollments\Models\Enrollment;
use App\Domains\Enrollments\Services\EnrollmentStatusService;
use App\Domains\Enrollments\States\ActiveState;
use App\Domains\Enrollments\States\EnrollmentStateFactory;
use App\Domains\Enrollments\States\EnrollmentStateInterface;
use App\Domains\Enrollments\States\ExpiredState;
use App\Domains\Enrollments\States\GracePeriodState;
use App\Domains\Enrollments\States\InactiveState;
use App\Domains\Enrollments\States\TrialState;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Test suite for the State Pattern implementation in Enrollments.
 * 
 * @see https://refactoring.guru/design-patterns/state
 */
class EnrollmentStateTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    // ==========================================
    // Individual State Tests
    // ==========================================

    #[Test]
    public function trial_state_has_correct_properties(): void
    {
        $state = new TrialState();

        $this->assertEquals('trial', $state->getName());
        $this->assertEquals('فترة تجريبية', $state->getLabel());
        $this->assertEquals('info', $state->getColor());
        $this->assertTrue($state->isTrial());
        $this->assertFalse($state->isActive());
        $this->assertFalse($state->isExpired());
    }

    #[Test]
    public function trial_state_allows_transitions(): void
    {
        $state = new TrialState();
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertTrue($state->canActivate($enrollment));
        $this->assertTrue($state->canDeactivate($enrollment));
        $this->assertTrue($state->canRenew($enrollment));
        $this->assertTrue($state->canAccessContent($enrollment));
        $this->assertEquals(['active', 'inactive', 'expired'], $state->getAllowedTransitions());
    }

    #[Test]
    public function active_state_has_correct_properties(): void
    {
        $state = new ActiveState();

        $this->assertEquals('active', $state->getName());
        $this->assertEquals('نشط', $state->getLabel());
        $this->assertEquals('success', $state->getColor());
        $this->assertFalse($state->isTrial());
        $this->assertTrue($state->isActive());
        $this->assertFalse($state->isExpired());
    }

    #[Test]
    public function active_state_allows_transitions(): void
    {
        $state = new ActiveState();
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertFalse($state->canActivate($enrollment));
        $this->assertTrue($state->canDeactivate($enrollment));
        $this->assertTrue($state->canRenew($enrollment));
        $this->assertTrue($state->canAccessContent($enrollment));
        $this->assertEquals(['inactive', 'expired', 'grace_period'], $state->getAllowedTransitions());
    }

    #[Test]
    public function inactive_state_has_correct_properties(): void
    {
        $state = new InactiveState();

        $this->assertEquals('inactive', $state->getName());
        $this->assertEquals('غير نشط', $state->getLabel());
        $this->assertEquals('warning', $state->getColor());
        $this->assertFalse($state->isTrial());
        $this->assertFalse($state->isActive());
        $this->assertFalse($state->isExpired());
    }

    #[Test]
    public function inactive_state_allows_transitions(): void
    {
        $state = new InactiveState();
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertTrue($state->canActivate($enrollment));
        $this->assertFalse($state->canDeactivate($enrollment));
        $this->assertTrue($state->canRenew($enrollment));
        $this->assertFalse($state->canAccessContent($enrollment));
        $this->assertEquals(['active', 'trial'], $state->getAllowedTransitions());
    }

    #[Test]
    public function grace_period_state_has_correct_properties(): void
    {
        $state = new GracePeriodState();

        $this->assertEquals('grace_period', $state->getName());
        $this->assertEquals('فترة سماح', $state->getLabel());
        $this->assertEquals('warning', $state->getColor());
        $this->assertFalse($state->isTrial());
        $this->assertFalse($state->isActive());
        $this->assertFalse($state->isExpired());
    }

    #[Test]
    public function grace_period_state_allows_transitions(): void
    {
        $state = new GracePeriodState();
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertTrue($state->canActivate($enrollment));
        $this->assertTrue($state->canDeactivate($enrollment));
        $this->assertTrue($state->canRenew($enrollment));
        $this->assertTrue($state->canAccessContent($enrollment));
        $this->assertEquals(['active', 'inactive', 'expired'], $state->getAllowedTransitions());
    }

    #[Test]
    public function expired_state_has_correct_properties(): void
    {
        $state = new ExpiredState();

        $this->assertEquals('expired', $state->getName());
        $this->assertEquals('منتهي', $state->getLabel());
        $this->assertEquals('danger', $state->getColor());
        $this->assertFalse($state->isTrial());
        $this->assertFalse($state->isActive());
        $this->assertTrue($state->isExpired());
    }

    #[Test]
    public function expired_state_allows_transitions(): void
    {
        $state = new ExpiredState();
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertTrue($state->canActivate($enrollment));
        $this->assertFalse($state->canDeactivate($enrollment));
        $this->assertTrue($state->canRenew($enrollment));
        $this->assertFalse($state->canAccessContent($enrollment));
        $this->assertEquals(['active', 'inactive'], $state->getAllowedTransitions());
    }

    // ==========================================
    // State Factory Tests
    // ==========================================

    #[Test]
    public function factory_creates_state_from_name(): void
    {
        $this->assertInstanceOf(TrialState::class, EnrollmentStateFactory::createFromName('trial'));
        $this->assertInstanceOf(ActiveState::class, EnrollmentStateFactory::createFromName('active'));
        $this->assertInstanceOf(InactiveState::class, EnrollmentStateFactory::createFromName('inactive'));
        $this->assertInstanceOf(GracePeriodState::class, EnrollmentStateFactory::createFromName('grace_period'));
        $this->assertInstanceOf(ExpiredState::class, EnrollmentStateFactory::createFromName('expired'));
    }

    #[Test]
    public function factory_throws_exception_for_invalid_state(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown enrollment state: invalid');

        EnrollmentStateFactory::createFromName('invalid');
    }

    #[Test]
    public function factory_returns_available_states(): void
    {
        $states = EnrollmentStateFactory::getAvailableStates();

        $this->assertCount(5, $states);
        $this->assertContains('trial', $states);
        $this->assertContains('active', $states);
        $this->assertContains('inactive', $states);
        $this->assertContains('grace_period', $states);
        $this->assertContains('expired', $states);
    }

    #[Test]
    public function factory_validates_state_names(): void
    {
        $this->assertTrue(EnrollmentStateFactory::isValidState('trial'));
        $this->assertTrue(EnrollmentStateFactory::isValidState('active'));
        $this->assertFalse(EnrollmentStateFactory::isValidState('unknown'));
    }

    #[Test]
    public function factory_returns_all_state_instances(): void
    {
        $states = EnrollmentStateFactory::getAllStates();

        $this->assertCount(5, $states);
        foreach ($states as $state) {
            $this->assertInstanceOf(EnrollmentStateInterface::class, $state);
        }
    }

    // ==========================================
    // State Transition Tests
    // ==========================================

    #[Test]
    public function trial_state_transitions_to_active_when_activated(): void
    {
        $state = new TrialState();
        
        $enrollment = Mockery::mock(Enrollment::class);
        $enrollment->is_active = true;
        $enrollment->subscription_end = now()->addDays(30);

        $nextState = $state->getNextState($enrollment);

        $this->assertInstanceOf(ActiveState::class, $nextState);
    }

    #[Test]
    public function trial_state_transitions_to_inactive_when_deactivated(): void
    {
        $state = new TrialState();
        
        $enrollment = Mockery::mock(Enrollment::class);
        $enrollment->is_active = false;

        $nextState = $state->getNextState($enrollment);

        $this->assertInstanceOf(InactiveState::class, $nextState);
    }

    #[Test]
    public function active_state_transitions_to_inactive_when_deactivated(): void
    {
        $state = new ActiveState();
        
        $enrollment = Mockery::mock(Enrollment::class);
        $enrollment->is_active = false;

        $nextState = $state->getNextState($enrollment);

        $this->assertInstanceOf(InactiveState::class, $nextState);
    }

    #[Test]
    public function active_state_transitions_to_grace_period_when_expired(): void
    {
        $state = new ActiveState();
        
        $enrollment = Mockery::mock(Enrollment::class);
        $enrollment->is_active = true;
        $enrollment->subscription_end = now()->subDay();

        $nextState = $state->getNextState($enrollment);

        $this->assertInstanceOf(GracePeriodState::class, $nextState);
    }

    #[Test]
    public function inactive_state_transitions_to_active_when_reactivated(): void
    {
        $state = new InactiveState();
        
        $enrollment = Mockery::mock(Enrollment::class);
        $enrollment->is_active = true;
        $enrollment->subscription_end = now()->addDays(30);

        $nextState = $state->getNextState($enrollment);

        $this->assertInstanceOf(ActiveState::class, $nextState);
    }

    #[Test]
    public function inactive_state_transitions_to_trial_without_subscription(): void
    {
        $state = new InactiveState();
        
        $enrollment = Mockery::mock(Enrollment::class);
        $enrollment->is_active = true;
        $enrollment->subscription_end = null;

        $nextState = $state->getNextState($enrollment);

        $this->assertInstanceOf(TrialState::class, $nextState);
    }

    // ==========================================
    // Data Provider Tests
    // ==========================================

    public static function stateAccessDataProvider(): array
    {
        return [
            'trial allows access' => [new TrialState(), true],
            'active allows access' => [new ActiveState(), true],
            'inactive denies access' => [new InactiveState(), false],
            'grace period allows access' => [new GracePeriodState(), true],
            'expired denies access' => [new ExpiredState(), false],
        ];
    }

    #[Test]
    #[DataProvider('stateAccessDataProvider')]
    public function states_have_correct_content_access(EnrollmentStateInterface $state, bool $canAccess): void
    {
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertEquals($canAccess, $state->canAccessContent($enrollment));
    }

    public static function stateActivationDataProvider(): array
    {
        return [
            'trial can activate' => [new TrialState(), true],
            'active cannot activate' => [new ActiveState(), false],
            'inactive can activate' => [new InactiveState(), true],
            'grace period can activate' => [new GracePeriodState(), true],
            'expired can activate' => [new ExpiredState(), true],
        ];
    }

    #[Test]
    #[DataProvider('stateActivationDataProvider')]
    public function states_have_correct_activation_rules(EnrollmentStateInterface $state, bool $canActivate): void
    {
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertEquals($canActivate, $state->canActivate($enrollment));
    }

    public static function stateRenewalDataProvider(): array
    {
        return [
            'trial can renew' => [new TrialState(), true],
            'active can renew' => [new ActiveState(), true],
            'inactive can renew' => [new InactiveState(), true],
            'grace period can renew' => [new GracePeriodState(), true],
            'expired can renew' => [new ExpiredState(), true],
        ];
    }

    #[Test]
    #[DataProvider('stateRenewalDataProvider')]
    public function all_states_allow_renewal(EnrollmentStateInterface $state, bool $canRenew): void
    {
        $enrollment = Mockery::mock(Enrollment::class);

        $this->assertEquals($canRenew, $state->canRenew($enrollment));
    }
}
