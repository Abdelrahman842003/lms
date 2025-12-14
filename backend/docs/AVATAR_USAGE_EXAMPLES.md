# نظام رفع الصور - أمثلة الاستخدام

## 📖 نظرة عامة

هذا الملف يحتوي على أمثلة عملية لاستخدام نظام رفع الصور في المشروع.

---

## 1️⃣ استخدام في صفحة Teacher Profile

### الكود الكامل

```tsx
// frontend/src/app/teacher/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import AvatarUpload from "@/components/AvatarUpload";
import { useAuth } from "@/contexts/AuthContext";

export default function TeacherProfile() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setUsername(user.username || "");
        }
    }, [user]);

    const handleAvatarUploadSuccess = (url: string) => {
        setAvatarUrl(url);
        // يمكنك أيضاً تحديث الـ user في الـ context
    };

    const handleAvatarDeleteSuccess = () => {
        setAvatarUrl(null);
    };

    return (
        <div className="profile-container">
            <h1>الملف الشخصي</h1>

            {/* Avatar Section */}
            <div className="avatar-section">
                <h2>الصورة الشخصية</h2>
                <AvatarUpload
                    currentAvatarUrl={avatarUrl}
                    size="large"
                    onUploadSuccess={handleAvatarUploadSuccess}
                    onDeleteSuccess={handleAvatarDeleteSuccess}
                />
            </div>

            {/* Profile Info */}
            <div className="profile-info">
                <div className="form-group">
                    <label>الاسم</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>اسم المستخدم</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>

                <button className="save-btn">حفظ التغييرات</button>
            </div>
        </div>
    );
}
```

---

## 2️⃣ استخدام في Navbar مع Avatar صغير

### مثال استخدام

```tsx
// frontend/src/components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import { getAvatarUrl } from "@/services/avatarService";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
    const { user } = useAuth();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        loadAvatar();
    }, []);

    const loadAvatar = async () => {
        try {
            const response = await getAvatarUrl();
            if (response.success && response.data?.url) {
                setAvatarUrl(response.data.url);
            }
        } catch (err) {
            console.log("No avatar found");
        }
    };

    return (
        <nav className="navbar">
            <div className="nav-logo">LMS</div>

            <div className="nav-user">
                <span>{user?.name}</span>

                {/* Avatar Display */}
                <div className="nav-avatar">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" />
                    ) : (
                        <div className="avatar-placeholder">
                            {user?.name?.charAt(0)}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
```

---

## 3️⃣ استخدام Avatar في قائمة الطلاب

### مثال: عرض صور الطلاب في جدول

```tsx
// frontend/src/app/admin/students/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getStudents } from "@/services/authService";

interface Student {
    id: string;
    name: string;
    username: string;
    avatar_key: string | null;
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await getStudents();
            setStudents(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    // الحصول على URL الصورة من KV
    const getStudentAvatarUrl = (avatarKey: string | null) => {
        if (!avatarKey) return null;

        // يمكنك إنشاء endpoint خاص لعرض avatars الطلاب
        // أو استخدام نفس الـ endpoint مع تمرير student_id
        return `https://pub-xxxxx.r2.dev/avatars/${avatarKey}.webp`;
    };

    return (
        <div className="students-page">
            <h1>قائمة الطلاب</h1>

            <table>
                <thead>
                    <tr>
                        <th>الصورة</th>
                        <th>الاسم</th>
                        <th>اسم المستخدم</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => (
                        <tr key={student.id}>
                            <td>
                                <div className="student-avatar">
                                    {student.avatar_key ? (
                                        <img
                                            src={getStudentAvatarUrl(
                                                student.avatar_key
                                            )}
                                            alt={student.name}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>{student.name}</td>
                            <td>{student.username}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

---

## 4️⃣ Backend: إضافة Avatar في User Response

### تحديث Controllers لإرجاع Avatar URL

```php
// backend/app/Http/Controllers/Teacher/AuthController.php

use App\Services\AvatarService;

class AuthController extends Controller
{
    private AvatarService $avatarService;

    public function __construct(AvatarService $avatarService)
    {
        $this->avatarService = $avatarService;
    }

    public function me(Request $request)
    {
        $user = $request->user();

        // Get avatar URL if exists
        $avatarUrl = null;
        if ($user->avatar_key) {
            $avatarUrl = $this->avatarService->getAvatarUrl($user, 'teacher');
        }

        return response()->json([
            'status' => true,
            'status_code' => 200,
            'message' => 'User data retrieved successfully',
            'data' => [
                'user' => $user,
                'avatar_url' => $avatarUrl, // ← إضافة URL
                'role' => 'teacher',
            ],
        ]);
    }
}
```

---

## 5️⃣ Batch Upload: رفع صور لعدة مستخدمين

### API Endpoint للـ Batch Upload (Admin only)

```php
// backend/app/Http/Controllers/Admin/BatchAvatarController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AvatarService;
use App\Models\Student;
use Illuminate\Http\Request;

class BatchAvatarController extends Controller
{
    private AvatarService $avatarService;

    public function __construct(AvatarService $avatarService)
    {
        $this->avatarService = $avatarService;
    }

    /**
     * Upload avatars for multiple students
     * Expected format:
     * {
     *   "avatars": [
     *     {"student_id": "123", "file": <binary>},
     *     {"student_id": "456", "file": <binary>}
     *   ]
     * }
     */
    public function batchUploadStudentAvatars(Request $request)
    {
        $request->validate([
            'avatars' => 'required|array',
            'avatars.*.student_id' => 'required|exists:students,id',
            'avatars.*.file' => 'required|image|max:5120',
        ]);

        $results = [];

        foreach ($request->input('avatars') as $avatarData) {
            try {
                $student = Student::find($avatarData['student_id']);
                $file = $avatarData['file'];

                $result = $this->avatarService->uploadAvatar(
                    $student,
                    'student',
                    $file
                );

                $results[] = [
                    'student_id' => $student->id,
                    'success' => true,
                    'url' => $result['url'],
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'student_id' => $avatarData['student_id'],
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Batch upload completed',
            'results' => $results,
        ]);
    }
}
```

---

## 6️⃣ React Hook للـ Avatar Management

### Custom Hook

```tsx
// frontend/src/hooks/useAvatar.ts
import { useState, useEffect } from "react";
import {
    getAvatarUrl,
    uploadAvatar,
    deleteAvatar,
} from "@/services/avatarService";

interface UseAvatarReturn {
    avatarUrl: string | null;
    isLoading: boolean;
    error: string | null;
    upload: (file: File) => Promise<void>;
    remove: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useAvatar(): UseAvatarReturn {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAvatar();
    }, []);

    const loadAvatar = async () => {
        try {
            setIsLoading(true);
            const response = await getAvatarUrl();
            if (response.success && response.data?.url) {
                setAvatarUrl(response.data.url);
            }
        } catch (err) {
            // No avatar is fine
        } finally {
            setIsLoading(false);
        }
    };

    const upload = async (file: File) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await uploadAvatar(file);

            if (response.success && response.data?.url) {
                setAvatarUrl(response.data.url);
            }
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const remove = async () => {
        try {
            setIsLoading(true);
            setError(null);

            await deleteAvatar();
            setAvatarUrl(null);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        avatarUrl,
        isLoading,
        error,
        upload,
        remove,
        refresh: loadAvatar,
    };
}
```

### استخدام الـ Hook

```tsx
// في أي component
import { useAvatar } from "@/hooks/useAvatar";

export default function ProfilePage() {
    const { avatarUrl, isLoading, error, upload, remove } = useAvatar();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await upload(file);
        }
    };

    return (
        <div>
            {isLoading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            {avatarUrl && <img src={avatarUrl} alt="Avatar" />}

            <input type="file" onChange={handleFileChange} />
            {avatarUrl && <button onClick={remove}>حذف الصورة</button>}
        </div>
    );
}
```

---

## 🎯 ملاحظات مهمة

1. **Security**: كل المستخدمين يستخدمون نفس الـ endpoint، والنظام يتعرف على نوع المستخدم من الـ token
2. **Caching**: يمكنك إضافة caching للـ avatar URLs في Frontend لتقليل الطلبات
3. **Fallback**: دائماً استخدم placeholder عند عدم وجود صورة
4. **Error Handling**: اعرض رسائل واضحة للمستخدم عند الأخطاء
5. **Loading States**: اعرض loading indicator أثناء الرفع

---

## 📚 المراجع

-   [Walkthrough الكامل](file:///home/abdelrahman/.gemini/antigravity/brain/7ea2a644-299f-43eb-8a31-b587a004676f/walkthrough.md)
-   [دليل الإعداد](file:///home/abdelrahman/Desktop/New%20Folder/backend/docs/AVATAR_SETUP.md)
-   [Implementation Plan](file:///home/abdelrahman/.gemini/antigravity/brain/7ea2a644-299f-43eb-8a31-b587a004676f/implementation_plan.md)
