<?php

use App\Models\User;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;

uses(RefreshDatabase::class);

describe('Rate Limiting', function () {
    it('throttles login attempts', function () {
        for ($i = 0; $i < 12; $i++) {
            $response = $this->postJson('/api/v1/teacher/login', [
                'email' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
        }
        
        $response->assertStatus(429);
    });

    it('throttles payment endpoints', function () {
        $teacher = Teacher::factory()->create();
        $teacher->user->givePermissionTo('payment.create');
        
        for ($i = 0; $i < 12; $i++) {
            $response = $this->actingAs($teacher->user)
                ->postJson('/api/v1/teacher/payments', [
                    'amount' => 100,
                ]);
        }
        
        $response->assertStatus(429);
    });

    it('does not throttle general api within limits', function () {
        $teacher = Teacher::factory()->create();
        
        for ($i = 0; $i < 50; $i++) {
            $response = $this->actingAs($teacher->user)
                ->getJson('/api/v1/teacher/dashboard');
            
            $response->assertOk();
        }
    });
});
