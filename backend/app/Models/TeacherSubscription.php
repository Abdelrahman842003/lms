<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TeacherSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'month',
        'student_count',
        'amount_due',
        'amount_paid',
        'status',
        'notes',
    ];

    protected $casts = [
        'month' => 'date',
        'student_count' => 'integer',
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }
}
