<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SentNotification extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'admin_id',
        'title',
        'message',
        'recipient_type',
        'recipient_count',
    ];

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }
}
