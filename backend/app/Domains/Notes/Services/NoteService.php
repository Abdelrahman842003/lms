<?php

declare(strict_types=1);

namespace App\Domains\Notes\Services;

use App\Domains\Notes\Models\Note;
use App\Domains\Notes\Models\NoteAttachment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class NoteService
{
    private string $disk = 'r2';

    public function initiateNote(array $data, array $files): array
    {
        $note = Note::create([
            'academy_id' => $data['academy_id'] ?? null,
            'teacher_id' => $data['teacher_id'],
            'grade_id' => $data['grade_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'is_active' => false, // Set to false until upload is complete
        ]);

        $uploadUrls = [];
        $ttl = 3600; // 1 hour

        foreach ($files as $file) {
            $fileName = $file['name'];
            $mimeType = $file['mime'] ?? 'application/pdf';
            
            $path = $this->generatePath($note, $fileName);

            $client = Storage::disk($this->disk)->getClient();
            $expiry = now()->addSeconds($ttl);
            
            $command = $client->getCommand('PutObject', [
                'Bucket' => config("filesystems.disks.{$this->disk}.bucket"),
                'Key' => $path,
                'ContentType' => $mimeType,
                'ContentDisposition' => 'inline',
            ]);

            $presignedRequest = $client->createPresignedRequest($command, $expiry);
            $putUrl = (string) $presignedRequest->getUri();

            $uploadUrls[] = [
                'name' => $fileName,
                'path' => $path,
                'put_url' => $putUrl,
            ];
        }

        return [
            'note_id' => $note->id,
            'upload_urls' => $uploadUrls,
        ];
    }

    public function completeNote(Note $note, array $attachments, array $groupIds): Note
    {
        foreach ($attachments as $att) {
            $note->attachments()->create([
                'file_name' => $att['name'],
                'file_path' => $att['file_path'],
                'mime_type' => $att['mime_type'],
                'file_size' => $att['file_size'],
            ]);
        }

        $note->groups()->sync($groupIds);
        $note->update(['is_active' => true]);

        return $note->load(['attachments', 'groups']);
    }

    public function getNoteForStudent(string $noteId, string $studentId): ?Note
    {
        // This should check if the student belongs to any of the groups targetted by this note
        // But the controller will handle the initial filtering
        return Note::with('attachments')->findOrFail($noteId);
    }

    public function getPresignedDownloadUrl(NoteAttachment $attachment): string
    {
        return Storage::disk($this->disk)->temporaryUrl(
            $attachment->file_path,
            now()->addMinutes(30),
            [
                'ResponseContentDisposition' => 'inline',
                'ResponseContentType' => $attachment->mime_type,
            ]
        );
    }

    private function generatePath(Note $note, string $originalName): string
    {
        $safeName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));
        $extension = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION)) ?: 'pdf';
        
        return sprintf(
            'notes/%s/%s-%s.%s',
            $note->id,
            $safeName !== '' ? $safeName : 'note',
            Str::random(8),
            $extension,
        );
    }

    public function deleteNote(Note $note): void
    {
        foreach ($note->attachments as $attachment) {
            Storage::disk($this->disk)->delete($attachment->file_path);
            $attachment->delete();
        }
        $note->groups()->detach();
        $note->delete();
    }
}
