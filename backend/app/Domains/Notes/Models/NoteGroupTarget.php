<?php

declare(strict_types=1);

namespace App\Domains\Notes\Models;

use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class NoteGroupTarget extends Pivot
{
    use HasUuids;

    public $incrementing = false;

    protected $table = 'note_group_targets';

    protected $fillable = [
        'note_id',
        'group_id',
    ];

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }
}
