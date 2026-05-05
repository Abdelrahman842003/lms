---
title: New Feature Cookbook
description: End-to-end guide for adding a feature from scratch
---

# New Feature Cookbook

Complete guide for implementing a new feature in the Neetaq platform, from database to frontend.

## Scenario: Adding a "Study Material" Feature

We'll implement a feature where teachers can upload study materials (PDFs, videos) that students can access.

## Step 1: Database Design

### 1.1 Create Migration

```bash
docker compose exec octane php artisan make:migration create_study_materials_table
```

```php
<?php
// database/migrations/2026_02_26_000001_create_study_materials_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_materials', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('teacher_id')->constrained('teachers');
            $table->foreignUuid('academy_id')->constrained('academies');
            $table->foreignUuid('grade_id')->nullable()->constrained('grades');
            $table->foreignUuid('group_id')->nullable()->constrained('groups');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_key'); // R2 storage key
            $table->string('file_type'); // pdf, video, etc.
            $table->integer('file_size'); // in bytes
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['teacher_id', 'status']);
            $table->index(['academy_id', 'status']);
            $table->index(['grade_id', 'group_id']);
        });
        
        // Pivot table for student access tracking
        Schema::create('study_material_student', function (Blueprint $table) {
            $table->foreignUuid('study_material_id')->constrained('study_materials');
            $table->foreignUuid('student_id')->constrained('students');
            $table->timestamp('viewed_at')->nullable();
            $table->integer('view_count')->default(0);
            $table->timestamps();
            
            $table->primary(['study_material_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_material_student');
        Schema::dropIfExists('study_materials');
    }
};
```

### 1.2 Run Migration

```bash
docker compose exec octane php artisan migrate
```

## Step 2: Backend Implementation

### 2.1 Create Model

```bash
docker compose exec octane php artisan make:model Domains/Study/Models/StudyMaterial
```

```php
<?php
// app/Domains/Study/Models/StudyMaterial.php

namespace App\Domains\Study\Models;

use App\Domains\Auth\Models\Academy;
use App\Domains\Auth\Models\Student;
use App\Domains\Auth\Models\Teacher;
use App\Domains\Enrollments\Models\Grade;
use App\Domains\Enrollments\Models\Group;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class StudyMaterial extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'teacher_id',
        'academy_id',
        'grade_id',
        'group_id',
        'title',
        'description',
        'file_key',
        'file_type',
        'file_size',
        'status',
        'published_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'published_at' => 'datetime',
    ];

    // Relationships
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function academy(): BelongsTo
    {
        return $this->belongsTo(Academy::class);
    }

    public function grade(): BelongsTo
    {
        return $this->belongsTo(Grade::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'study_material_student')
            ->withPivot(['viewed_at', 'view_count'])
            ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeForStudent($query, string $studentId)
    {
        return $query->whereHas('academy.students', function ($q) use ($studentId) {
            $q->where('students.id', $studentId);
        });
    }
}
```

### 2.2 Create DTOs

```php
<?php
// app/Domains/Study/DTOs/StudyMaterialData.php

namespace App\Domains\Study\DTOs;

use Illuminate\Http\UploadedFile;

class StudyMaterialData
{
    public function __construct(
        public readonly string $title,
        public readonly ?string $description,
        public readonly ?string $gradeId,
        public readonly ?string $groupId,
        public readonly UploadedFile $file,
        public readonly ?string $publishedAt = null,
    ) {}

    public static function fromRequest(array $data): self
    {
        return new self(
            title: $data['title'],
            description: $data['description'] ?? null,
            gradeId: $data['grade_id'] ?? null,
            groupId: $data['group_id'] ?? null,
            file: $data['file'],
            publishedAt: $data['published_at'] ?? null,
        );
    }
}
```

### 2.3 Create Service

```php
<?php
// app/Domains/Study/Services/StudyMaterialService.php

namespace App\Domains\Study\Services;

use App\Domains\Auth\Models\Teacher;
use App\Domains\Media\Services\StorageService;
use App\Domains\Study\DTOs\StudyMaterialData;
use App\Domains\Study\Models\StudyMaterial;

class StudyMaterialService
{
    public function __construct(
        private StorageService $storage
    ) {}

    public function create(Teacher $teacher, StudyMaterialData $data): StudyMaterial
    {
        // Upload file to R2
        $fileKey = $this->storage->upload(
            file: $data->file,
            path: "study-materials/{$teacher->id}",
        );

        return StudyMaterial::create([
            'teacher_id' => $teacher->id,
            'academy_id' => $teacher->academies()->first()->id,
            'grade_id' => $data->gradeId,
            'group_id' => $data->groupId,
            'title' => $data->title,
            'description' => $data->description,
            'file_key' => $fileKey,
            'file_type' => $data->file->getClientOriginalExtension(),
            'file_size' => $data->file->getSize(),
            'published_at' => $data->publishedAt,
        ]);
    }

    public function getForTeacher(Teacher $teacher, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return StudyMaterial::where('teacher_id', $teacher->id)
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['grade_id'] ?? null, fn ($q, $gradeId) => $q->where('grade_id', $gradeId))
            ->with(['grade', 'group'])
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function getForStudent(string $studentId, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return StudyMaterial::active()
            ->published()
            ->forStudent($studentId)
            ->when($filters['grade_id'] ?? null, fn ($q, $gradeId) => $q->where('grade_id', $gradeId))
            ->with(['teacher', 'grade'])
            ->latest('published_at')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function recordView(string $materialId, string $studentId): void
    {
        $material = StudyMaterial::findOrFail($materialId);
        
        $material->students()->syncWithoutDetaching([
            $studentId => [
                'viewed_at' => now(),
                'view_count' => \DB::raw('view_count + 1'),
            ],
        ]);
    }

    public function delete(StudyMaterial $material): void
    {
        // Delete file from storage
        $this->storage->delete($material->file_key);
        
        $material->delete();
    }
}
```

### 2.4 Create Controller

```php
<?php
// app/Domains/Application/Http/Controllers/Teacher/StudyMaterialController.php

namespace App\Domains\Application\Http\Controllers\Teacher;

use App\Domains\Application\Http\Controllers\Controller;
use App\Domains\Application\Http\Requests\Teacher\StudyMaterial\StoreRequest;
use App\Domains\Study\DTOs\StudyMaterialData;
use App\Domains\Study\Resources\StudyMaterialResource;
use App\Domains\Study\Services\StudyMaterialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyMaterialController extends Controller
{
    public function __construct(
        private StudyMaterialService $service
    ) {}

    public function index(Request $request): JsonResponse
    {
        $materials = $this->service->getForTeacher(
            $request->user(),
            $request->only(['status', 'grade_id', 'per_page'])
        );

        return $this->successResponse(
            StudyMaterialResource::collection($materials)
        );
    }

    public function store(StoreRequest $request): JsonResponse
    {
        $data = StudyMaterialData::fromRequest($request->validated());
        
        $material = $this->service->create($request->user(), $data);

        return $this->successResponse(
            new StudyMaterialResource($material),
            'Study material uploaded successfully',
            201
        );
    }

    public function destroy(string $id): JsonResponse
    {
        $material = StudyMaterial::where('teacher_id', auth()->id())
            ->findOrFail($id);
        
        $this->service->delete($material);

        return $this->successResponse(null, 'Study material deleted');
    }
}
```

### 2.5 Create Request Validation

```php
<?php
// app/Domains/Application/Http/Requests/Teacher/StudyMaterial/StoreRequest.php

namespace App\Domains\Application\Http\Requests\Teacher\StudyMaterial;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'grade_id' => 'nullable|uuid|exists:grades,id',
            'group_id' => 'nullable|uuid|exists:groups,id',
            'file' => 'required|file|mimes:pdf,mp4,mov|max:52428800', // 50MB
            'published_at' => 'nullable|date|after_or_equal:now',
        ];
    }

    public function messages(): array
    {
        return [
            'file.max' => 'The file size must not exceed 50MB.',
            'file.mimes' => 'Only PDF and video files are supported.',
        ];
    }
}
```

### 2.6 Create Resource

```php
<?php
// app/Domains/Study/Resources/StudyMaterialResource.php

namespace App\Domains\Study\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StudyMaterialResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'file' => [
                'url' => $this->storage->url($this->file_key),
                'type' => $this->file_type,
                'size' => $this->file_size,
                'size_formatted' => $this->formatFileSize($this->file_size),
            ],
            'grade' => $this->whenLoaded('grade', fn () => [
                'id' => $this->grade->id,
                'name' => $this->grade->name,
            ]),
            'group' => $this->whenLoaded('group', fn () => [
                'id' => $this->group->id,
                'name' => $this->group->name,
            ]),
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
        ];
    }

    private function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $unitIndex = 0;
        
        while ($bytes >= 1024 && $unitIndex < count($units) - 1) {
            $bytes /= 1024;
            $unitIndex++;
        }
        
        return round($bytes, 2) . ' ' . $units[$unitIndex];
    }
}
```

### 2.7 Add Routes

```php
<?php
// routes/api.php

// Inside teacher routes group
Route::middleware(['auth:sanctum', EnsureTeacherNotSuspended::class])
    ->prefix('teacher')
    ->group(function () {
        
        // Study Materials
        Route::get('study-materials', [StudyMaterialController::class, 'index']);
        Route::post('study-materials', [StudyMaterialController::class, 'store']);
        Route::delete('study-materials/{id}', [StudyMaterialController::class, 'destroy']);
        
    });

// Student routes
Route::middleware('auth:sanctum')
    ->prefix('student')
    ->group(function () {
        
        Route::get('study-materials', [StudentStudyMaterialController::class, 'index']);
        Route::post('study-materials/{id}/view', [StudentStudyMaterialController::class, 'recordView']);
        
    });
```

## Step 3: Frontend Implementation

### 3.1 Create Types

```typescript
// types/studyMaterial.ts

export interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  file: {
    url: string;
    type: string;
    size: number;
    sizeFormatted: string;
  };
  grade?: {
    id: string;
    name: string;
  };
  group?: {
    id: string;
    name: string;
  };
  status: 'active' | 'inactive';
  publishedAt: string | null;
  createdAt: string;
}

export interface CreateStudyMaterialData {
  title: string;
  description?: string;
  gradeId?: string;
  groupId?: string;
  file: File;
  publishedAt?: string;
}
```

### 3.2 Create Service

```typescript
// services/studyMaterialService.ts

import { apiClient } from '@/lib/apiClient';
import { StudyMaterial, CreateStudyMaterialData } from '@/types/studyMaterial';

export const studyMaterialService = {
  async getAll(): Promise<StudyMaterial[]> {
    return apiClient.get('/teacher/study-materials');
  },

  async create(data: CreateStudyMaterialData): Promise<StudyMaterial> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('file', data.file);
    
    if (data.description) formData.append('description', data.description);
    if (data.gradeId) formData.append('grade_id', data.gradeId);
    if (data.groupId) formData.append('group_id', data.groupId);
    if (data.publishedAt) formData.append('published_at', data.publishedAt);

    return apiClient.post('/teacher/study-materials', formData, {
      // headers: { 'Content-Type': 'multipart/form-data' }, // Avoid manual Content-Type with FormData
    });  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/teacher/study-materials/${id}`);
  },
};
```

### 3.3 Create React Query Hooks

```typescript
// hooks/useStudyMaterials.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studyMaterialService } from '@/services/studyMaterialService';
import { StudyMaterial, CreateStudyMaterialData } from '@/types/studyMaterial';

export function useStudyMaterials() {
  return useQuery<StudyMaterial[]>({
    queryKey: ['studyMaterials'],
    queryFn: () => studyMaterialService.getAll(),
  });
}

export function useCreateStudyMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studyMaterialService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyMaterials'] });
    },
  });
}

export function useDeleteStudyMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studyMaterialService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studyMaterials'] });
    },
  });
}
```

### 3.4 Create Components

```tsx
// components/study-materials/StudyMaterialList.tsx
'use client';

import { useStudyMaterials, useDeleteStudyMaterial } from '@/hooks/useStudyMaterials';
import { FileIcon, TrashIcon, DownloadIcon } from 'lucide-react';

export function StudyMaterialList() {
  const { data: materials, isLoading } = useStudyMaterials();
  const deleteMaterial = useDeleteStudyMaterial();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {materials?.map((material) => (
        <div
          key={material.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center gap-4">
            <FileIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-medium">{material.title}</h3>
              <p className="text-sm text-gray-500">
                {material.file.sizeFormatted} • {material.file.type}
                {material.grade && ` • ${material.grade.name}`}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <a
              href={material.file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded"
            >
              <DownloadIcon className="w-4 h-4" />
            </a>
            <button
              onClick={() => deleteMaterial.mutate(material.id)}
              className="p-2 hover:bg-red-100 rounded text-red-500"
              disabled={deleteMaterial.isPending}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

```tsx
// components/study-materials/UploadForm.tsx
'use client';

import { useState } from 'react';
import { useCreateStudyMaterial } from '@/hooks/useStudyMaterials';
import { useGrades } from '@/hooks/useGrades';

export function UploadForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const createMaterial = useCreateStudyMaterial();
  const { data: grades } = useGrades();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    createMaterial.mutate({
      title,
      description,
      gradeId,
      file,
    }, {
      onSuccess: () => {
        setTitle('');
        setDescription('');
        setGradeId('');
        setFile(null);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Grade (Optional)</label>
        <select
          value={gradeId}
          onChange={(e) => setGradeId(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">All Grades</option>
          {grades?.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">File</label>
        <input
          type="file"
          accept=".pdf,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
          required
        />
        <p className="text-sm text-gray-500">Max size: 50MB</p>
      </div>

      <button
        type="submit"
        disabled={createMaterial.isPending || !file}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {createMaterial.isPending ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

### 3.5 Create Page

```tsx
// app/(teacher)/study-materials/page.tsx

import { StudyMaterialList } from '@/components/study-materials/StudyMaterialList';
import { UploadForm } from '@/components/study-materials/UploadForm';

export default function StudyMaterialsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Study Materials</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-medium mb-4">Upload New</h2>
          <UploadForm />
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-4">Your Materials</h2>
          <StudyMaterialList />
        </div>
      </div>
    </div>
  );
}
```

## Step 4: Testing

### 4.1 Backend Tests

```php
<?php
// tests/Feature/StudyMaterialTest.php

uses()->group('study-materials');

it('allows teachers to upload study materials', function () {
    $teacher = Teacher::factory()->create();
    
    $response = $this->actingAs($teacher, 'teacher')
        ->postJson('/api/v1/teacher/study-materials', [
            'title' => 'Test Material',
            'file' => UploadedFile::fake()->pdf('test.pdf'),
        ]);
    
    $response->assertCreated()
        ->assertJsonPath('data.title', 'Test Material');
    
    $this->assertDatabaseHas('study_materials', [
        'title' => 'Test Material',
        'teacher_id' => $teacher->id,
    ]);
});

it('lists study materials for teacher', function () {
    $teacher = Teacher::factory()->create();
    StudyMaterial::factory()->count(3)->for($teacher)->create();
    
    $response = $this->actingAs($teacher, 'teacher')
        ->getJson('/api/v1/teacher/study-materials');
    
    $response->assertOk()
        ->assertJsonCount(3, 'data');
});
```

### 4.2 Frontend Tests

```typescript
// components/study-materials/__tests__/UploadForm.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { UploadForm } from '../UploadForm';

jest.mock('@/hooks/useStudyMaterials');

describe('UploadForm', () => {
  it('renders form fields', () => {
    render(<UploadForm />);
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/file/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('submits form with data', () => {
    const mockCreate = jest.fn();
    jest.mocked(useCreateStudyMaterial).mockReturnValue({
      mutate: mockCreate,
      isPending: false,
    } as any);

    render(<UploadForm />);
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Material' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /upload/i }));
    
    expect(mockCreate).toHaveBeenCalled();
  });
});
```

## Step 5: Deployment

### 5.1 Run Tests

```bash
# Backend tests
docker compose exec octane php artisan test --filter=StudyMaterial

# Frontend tests
docker compose exec frontend npm test -- --testPathPattern=study-materials
```

### 5.2 Deploy

```bash
# Deploy to production
./deploy.sh
```

## References

- [Backend Architecture](/backend/architecture)
- [Frontend Architecture](/frontend/architecture)
- [Database](/backend/database)
- [API Client](/frontend/api-client)

## TODO

- [ ] Add feature flag support
- [ ] Add analytics tracking
- [ ] Implement caching strategy
- [ ] Add bulk upload support
