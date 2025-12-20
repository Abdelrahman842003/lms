// Basic User types
export interface User {
    id: string | number
    name: string
    username?: string
    avatar?: string
    userType: 'admin' | 'teacher' | 'student' | 'secretary'
    createdAt: string
    updatedAt: string
    phone?: string
    parent_phone?: string
    location?: string
    gender?: string
    education_type?: string
    teachers?: any[]
}

// Education platform specific types
export interface Teacher {
    id: number
    name: string
    created_at: string
    updated_at: string
}

export interface Student {
    id: number
    name: string
    created_at: string
    updated_at: string
}

// Authentication response
export interface AuthResponse {
    token: string
    user: Teacher | Student
    role: 'teacher' | 'student'
}
