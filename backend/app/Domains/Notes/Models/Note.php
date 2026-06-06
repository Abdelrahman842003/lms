<?php

declare(strict_types=1);

namespace App\Domains\Notes\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use App\Domains\Support\Traits\UsesTeacherProfileScope;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Note extends Model
{
    use HasUuids, SoftDeletes, UsesTeacherProfileScope;

    protected $fillable = [
        'academy_id',
        'teacher_profile_id',
        'owner_type',
        'owner_id',
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

    // The teacherProfile relation is provided by the UsesTeacherProfileScope trait.

    /**
     * Get the owning model of the note (e.g. Teacher or Academy).
     */
    public function owner()
    {
        return $this->morphTo();
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
