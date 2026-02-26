<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domains\Enrollments\Models\Enrollment;
use App\Models\Academy;
use App\Domains\Subscriptions\Models\PaymentLog;
use App\Models\Student;
use App\Domains\Subscriptions\Models\Subscription;
use App\Models\Teacher;
use App\Services\Admin\ReportService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for ReportService with subscription_fee integration
 * 
 * Tests subscription_fee calculations per SUBSCRIPTION_SYSTEM_CHANGES.md:
 * - Teachers: 60 EGP/student/month
 * - Academies: 40 EGP/student/month
 */
final class ReportServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReportService $reportService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->reportService = new ReportService();
    }

    /**
     * Test teacher report generation with subscription_fee calculation
     */
    public function test_teacher_report_calculates_subscription_fee_correctly(): void
    {
        // Arrange: Create a teacher with active students
        $teacher = Teacher::factory()->create([
            'subscription_fee' => 60.00,
            'status' => 'active',
        ]);

        // Create 10 active enrollments (students)
        for ($i = 0; $i < 10; $i++) {
            $student = Student::factory()->create();
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'status' => 'active',
                'created_at' => Carbon::now()->subDays(15),
            ]);
        }

        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Act: Generate teacher report
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        // Assert: Verify subscription_fee calculation
        // Expected: 10 students × 60 EGP = 600 EGP
        $this->assertEquals(10, $report->summary->active_students);
        $this->assertEquals(600.00, $report->summary->subscription_fee);
    }

    /**
     * Test academy report generation with subscription_fee calculation
     */
    public function test_academy_report_calculates_subscription_fee_correctly(): void
    {
        // Arrange: Create an academy with teachers and students
        $academy = Academy::factory()->create([
            'subscription_fee' => 40.00,
            'status' => 'active',
        ]);

        $teacher = Teacher::factory()->create([
            'academy_id' => $academy->id,
            'status' => 'active',
        ]);

        // Create 20 active enrollments across academy teachers
        for ($i = 0; $i < 20; $i++) {
            $student = Student::factory()->create();
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'status' => 'active',
                'created_at' => Carbon::now()->subDays(10),
            ]);
        }

        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Act: Generate academy report
        $report = $this->reportService->getAcademyReport($academy, $startDate, $endDate);

        // Assert: Verify subscription_fee calculation
        // Expected: 20 students × 40 EGP = 800 EGP
        $this->assertEquals(20, $report['summary']['active_enrollments']);
        $this->assertEquals(800.00, $report['summary']['subscription_fee']);
    }

    /**
     * Test admin report with total subscription fees from all sources
     */
    public function test_admin_report_calculates_total_subscription_fees(): void
    {
        // Arrange: Create academies and independent teachers
        $academy = Academy::factory()->create([
            'subscription_fee' => 40.00,
            'status' => 'active',
        ]);

        $academyTeacher = Teacher::factory()->create([
            'academy_id' => $academy->id,
            'status' => 'active',
        ]);

        $independentTeacher = Teacher::factory()->create([
            'academy_id' => null,
            'is_independent' => true,
            'subscription_fee' => 60.00,
            'status' => 'active',
        ]);

        // Academy students: 15 students × 40 EGP = 600 EGP
        for ($i = 0; $i < 15; $i++) {
            $student = Student::factory()->create();
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'teacher_id' => $academyTeacher->id,
                'status' => 'active',
            ]);
        }

        // Independent teacher students: 10 students × 60 EGP = 600 EGP
        for ($i = 0; $i < 10; $i++) {
            $student = Student::factory()->create();
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'teacher_id' => $independentTeacher->id,
                'status' => 'active',
            ]);
        }

        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Act: Generate admin report
        $report = $this->reportService->getAdminReport($startDate, $endDate);

        // Assert: Verify total subscription fees
        // Expected: 600 (academy) + 600 (independent) = 1200 EGP
        $this->assertEquals(1200.00, $report['summary']['total_subscription_fees']);
        $this->assertEquals(15, $report['summary']['academy_subscriptions']);
        $this->assertEquals(10, $report['summary']['independent_subscriptions']);
    }

    /**
     * Test subscription_fee uses stored value from database
     */
    public function test_subscription_fee_uses_database_value(): void
    {
        // Arrange: Teacher with custom subscription fee
        $teacher = Teacher::factory()->create([
            'subscription_fee' => 75.00, // Custom rate
            'status' => 'active',
        ]);

        $student = Student::factory()->create();
        Enrollment::factory()->create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'status' => 'active',
        ]);

        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Act
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        // Assert: Uses the custom 75 EGP rate, not default 60 EGP
        $this->assertEquals(75.00, $report->summary->subscription_fee);
    }

    /**
     * Test report handles inactive students correctly
     */
    public function test_report_excludes_inactive_students_from_subscription_fee(): void
    {
        // Arrange: Teacher with mix of active and inactive students
        $teacher = Teacher::factory()->create([
            'subscription_fee' => 60.00,
            'status' => 'active',
        ]);

        // 5 active students
        for ($i = 0; $i < 5; $i++) {
            $student = Student::factory()->create();
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'status' => 'active',
            ]);
        }

        // 3 inactive students
        for ($i = 0; $i < 3; $i++) {
            $student = Student::factory()->create();
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'status' => 'inactive',
            ]);
        }

        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Act
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        // Assert: Only active students counted (5 × 60 = 300)
        $this->assertEquals(5, $report->summary->active_students);
        $this->assertEquals(300.00, $report->summary->subscription_fee);
    }

    /**
     * Test report includes payment tracking
     */
    public function test_report_tracks_payments_against_subscription_fee(): void
    {
        // Arrange
        $teacher = Teacher::factory()->create([
            'subscription_fee' => 60.00,
            'status' => 'active',
        ]);

        $student = Student::factory()->create();
        $enrollment = Enrollment::factory()->create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'status' => 'active',
        ]);

        // Create a confirmed payment
        PaymentLog::factory()->create([
            'student_id' => $student->id,
            'teacher_id' => $teacher->id,
            'amount' => 60.00,
            'status' => 'confirmed',
            'created_at' => Carbon::now(),
        ]);

        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Act
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        // Assert
        $this->assertEquals(60.00, $report->summary->subscription_fee);
        $this->assertEquals(60.00, $report->summary->total_paid);
        $this->assertEquals(0.00, $report->summary->pending_payments);
    }

    /**
     * Test teachers list includes subscription_fee
     */
    public function test_teachers_list_includes_subscription_fee(): void
    {
        // Arrange
        Teacher::factory()->create([
            'name' => 'Teacher One',
            'subscription_fee' => 60.00,
            'status' => 'active',
        ]);

        Teacher::factory()->create([
            'name' => 'Teacher Two',
            'subscription_fee' => 75.00,
            'status' => 'active',
        ]);

        // Act
        $teachers = $this->reportService->getTeachersList();

        // Assert
        $this->assertCount(2, $teachers);
        $this->assertTrue($teachers->contains('subscription_fee', 60.00));
        $this->assertTrue($teachers->contains('subscription_fee', 75.00));
    }

    /**
     * Test academies list includes subscription_fee
     */
    public function test_academies_list_includes_subscription_fee(): void
    {
        // Arrange
        Academy::factory()->create([
            'name' => 'Academy One',
            'subscription_fee' => 40.00,
            'status' => 'active',
        ]);

        Academy::factory()->create([
            'name' => 'Academy Two',
            'subscription_fee' => 50.00,
            'status' => 'active',
        ]);

        // Act
        $academies = $this->reportService->getAcademiesList();

        // Assert
        $this->assertCount(2, $academies);
        $this->assertTrue($academies->contains('subscription_fee', 40.00));
        $this->assertTrue($academies->contains('subscription_fee', 50.00));
    }

    /**
     * Test monthly breakdown includes subscription data
     */
    public function test_monthly_breakdown_includes_subscription_data(): void
    {
        // Arrange
        $teacher = Teacher::factory()->create([
            'subscription_fee' => 60.00,
            'status' => 'active',
        ]);

        // Create enrollments for last 3 months
        for ($month = 0; $month < 3; $month++) {
            $date = Carbon::now()->subMonths($month);
            for ($i = 0; $i < 5; $i++) {
                $student = Student::factory()->create();
                Enrollment::factory()->create([
                    'student_id' => $student->id,
                    'teacher_id' => $teacher->id,
                    'status' => 'active',
                    'created_at' => $date,
                ]);
            }
        }

        $startDate = Carbon::now()->subMonths(3)->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Act
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        // Assert
        $this->assertNotEmpty($report->subscription_breakdown);
        $this->assertGreaterThanOrEqual(3, count($report->subscription_breakdown));
        
        // Each month should have subscription data
        foreach ($report->subscription_breakdown as $monthData) {
            $this->assertArrayHasKey('month', $monthData);
            $this->assertArrayHasKey('amount_due', $monthData);
            $this->assertArrayHasKey('amount_paid', $monthData);
        }
    }

    /**
     * Test eager loading prevents N+1 queries
     */
    public function test_report_uses_eager_loading(): void
    {
        // Arrange
        $teacher = Teacher::factory()->create([
            'subscription_fee' => 60.00,
            'status' => 'active',
        ]);

        // Create many students with enrollments
        for ($i = 0; $i < 20; $i++) {
            $student = Student::factory()->create();
            Enrollment::factory()->create([
                'student_id' => $student->id,
                'teacher_id' => $teacher->id,
                'status' => 'active',
            ]);
        }

        $startDate = Carbon::now()->startOfMonth();
        $endDate = Carbon::now()->endOfMonth();

        // Enable query log
        \DB::enableQueryLog();

        // Act
        $report = $this->reportService->getTeacherReport($teacher, $startDate, $endDate);

        $queryCount = count(\DB::getQueryLog());
        \DB::disableQueryLog();

        // Assert: Should use eager loading (less than 5 queries)
        // Without eager loading, this would be 1 + 20 queries
        $this->assertLessThan(5, $queryCount, 'Report should use eager loading to prevent N+1 queries');
        $this->assertNotNull($report);
    }
}
