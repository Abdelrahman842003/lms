---
title: Gamification & Attendance
description: Leaderboard system, mistake tracking, and QR-code attendance
---

# Gamification & Attendance

## Gamification

### Routes

| Path | Role | Description |
|------|------|-------------|
| `/teacher/gamification` | Teacher | Manage gamification settings |
| `/academy/gamification` | Academy | Manage gamification settings |
| `/student/leaderboard` | Student | View leaderboard |

### Student Mistake Tracking

| Path | Description |
|------|-------------|
| `/student/mistakes` | View mistake history |
| `/student/mistakes/quiz` | Retake mistakes as quiz |

## QR Code Attendance

The attendance system supports QR code generation (teacher/academy side) and scanning (student side).

### QR Code Generation

**Source:** `frontend/src/components/dashboard/QRCodeModal.tsx`

Teachers and academies can generate QR codes for lectures:

```tsx
<QRCodeModal
  isOpen={open}
  onClose={handleClose}
  url={qrCodeUrl}
  expiresAt={expirationTime}
  lectureTitle="Math 101"
/>
```

### QR Code Scanning

**Source:** `frontend/src/components/dashboard/QRScannerModal.tsx`

Uses `Html5Qrcode` with camera fallback (environment → user):

```tsx
<QRScannerModal
  isOpen={open}
  onClose={handleClose}
  onScanSuccess={handleScan}
  lectureTitle="Math 101"
/>
```

### Scan Attendance Modal

**Source:** `frontend/src/components/dashboard/ScanAttendanceModal.tsx`

Integrated attendance scanning with API:
- Processes scanned QR data
- Calls attendance API endpoint
- Shows processing state and results
- Error handling with toast notifications

### Manual Attendance

**Source:** `frontend/src/components/dashboard/ManualAttendanceModal.tsx`

Manual attendance by phone number:
- Student search by phone number
- Attendance marking with confirmation
- Auto-focus on open

### Attendance Details

**Source:** `frontend/src/components/dashboard/AttendanceDetailsModal.tsx`

Detailed view of attendance records for a lecture session.

## Attendance Routes

| Path | Role | Description |
|------|------|-------------|
| `/teacher/attendance` | Teacher | Attendance management |
| `/teacher/lectures/[id]/attendance` | Teacher | Lecture attendance |
| `/academy/attendance` | Academy | Attendance management |
| `/academy/lectures/[id]/attendees` | Academy | View attendees |
| `/academy/lectures/[id]/manual-attendance` | Academy | Manual attendance |
| `/student/attend` | Student | QR check-in |

## Lecture Session Modals

| Component | Description |
|-----------|-------------|
| `LectureSessionsModal` | Teacher view of lecture sessions |
| `AcademyLectureSessionsModal` | Academy view of lecture sessions |
| `StudentAttendanceSection` | Student attendance history section |

## Teacher Service - Attendance

**Source:** `frontend/src/services/teacherService.ts`

- QR code scanning and validation
- Attendance recording
- Expired code handling
