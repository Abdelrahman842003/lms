<?php

declare(strict_types=1);

namespace App\Domains\Notes\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteAttachment extends Model
{
    use HasUuids;

    protected $fillable = [
        'note_id',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
    ];

    public function note(): BelongsTo
    {
        return $this->belongsTo(Note::class);
    }
}
