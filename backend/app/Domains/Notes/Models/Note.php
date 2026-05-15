<?php

declare(strict_types=1);

namespace App\Domains\Notes\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'academy_id',
        'teacher_id',
        'grade_id',
        'title',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'note_group_targets', 'note_id', 'group_id')
            ->using(NoteGroupTarget::class)
            ->withTimestamps();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(NoteAttachment::class);
    }
}
