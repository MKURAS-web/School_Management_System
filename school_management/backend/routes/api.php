<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\SchoolController;
use App\Http\Controllers\SystemSettingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SchoolAdminController;
use App\Http\Controllers\SchoolClassController;
use App\Http\Controllers\SchoolStreamController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TeacherProfileController;
use App\Http\Controllers\TeacherAttendanceController;
use App\Http\Controllers\ExaminationController;
use App\Http\Controllers\AdminExaminationController;
use App\Http\Controllers\LessonPlanController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AnnouncementController;


// =========================
// AUTHENTICATION
// =========================

Route::post('/login', [AuthController::class, 'login'])
    ->name('login');


// =========================
// AUTHENTICATED USER
// =========================

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', [AuthController::class, 'user']);

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::put('/user/password', [AuthController::class, 'updatePassword']);

});


// =========================
// SUPER ADMIN
// =========================

Route::middleware(['auth:sanctum', 'role:super_admin'])
    ->group(function () {

        // Schools

        Route::get(
            '/schools/{school}/students',
            [SchoolController::class, 'students']
        );

        Route::apiResource(
            'schools',
            SchoolController::class
        );


        // School Admins

        Route::post(
            '/school-admins',
            [SchoolAdminController::class, 'store']
        );

        Route::get(
            '/school-admins',
            [SchoolAdminController::class, 'index']
        );

        Route::get(
            '/school-admins/{user}',
            [SchoolAdminController::class, 'show']
        );

        Route::put(
            '/school-admins/{user}',
            [SchoolAdminController::class, 'update']
        );

        Route::delete(
            '/school-admins/{user}',
            [SchoolAdminController::class, 'destroy']
        );


        // System Settings

        Route::apiResource(
            'system-settings',
            SystemSettingController::class
        );

    });


// =========================
// TEACHER AND STAFF DASHBOARD
// =========================

Route::middleware(['auth:sanctum', 'role:teacher,staff'])
    ->prefix('school')
    ->group(function () {

        Route::get(
            '/teacher/dashboard',
            [TeacherController::class, 'dashboard']
        );

    });


// =========================
// TEACHER AND STAFF PROFILE ACCESS
// =========================

Route::middleware(['auth:sanctum', 'role:school_admin,teacher,staff'])
    ->prefix('school')
    ->group(function () {

        Route::get(
            '/teachers/{user}',
            [TeacherController::class, 'show']
        );

        Route::put(
            '/teachers/{user}',
            [TeacherController::class, 'update']
        );

    });


// =========================
// SCHOOL ADMIN
// =========================

Route::middleware(['auth:sanctum', 'role:school_admin'])
    ->prefix('school')
    ->group(function () {

        // =========================
        // SCHOOL (current admin's school)
        // =========================

        Route::get(
            '/',
            [SchoolController::class, 'currentSchool']
        );

        // =========================
        // STUDENTS
        // =========================

        Route::post(
            '/students/import',
            [StudentController::class, 'import']
        );

        Route::get(
            '/students/download',
            [StudentController::class, 'download']
        )->name('students.download');

        Route::apiResource(
            'students',
            StudentController::class
        );


        // =========================
        // CLASSES
        // =========================

        Route::apiResource(
            'classes',
            SchoolClassController::class
        );


        // =========================
        // STREAMS
        // =========================

        Route::apiResource(
            'streams',
            SchoolStreamController::class
        );


        // =========================
        // SUBJECTS
        // =========================

        Route::get(
            '/subjects',
            [SubjectController::class, 'index']
        );

        Route::post(
            '/subjects',
            [SubjectController::class, 'store']
        );

        Route::get(
            '/subjects/{subject}',
            [SubjectController::class, 'show']
        );

        Route::put(
            '/subjects/{subject}',
            [SubjectController::class, 'update']
        );

        Route::delete(
            '/subjects/{subject}',
            [SubjectController::class, 'destroy']
        );

        Route::post(
            '/subjects/assign-class',
            [SubjectController::class, 'assignClass']
        );

        Route::post(
            '/subjects/assign-teacher',
            [SubjectController::class, 'assignTeacher']
        );


        // =========================
        // TEACHERS AND STAFF
        // =========================

        Route::get(
            '/staff',
            [TeacherController::class, 'index']
        );

        Route::get(
            '/teachers',
            [TeacherController::class, 'index']
        );

        Route::post(
            '/teachers',
            [TeacherController::class, 'store']
        );

        Route::delete(
            '/teachers/{user}',
            [TeacherController::class, 'destroy']
        );

        Route::post(
            '/teachers/assign-subjects',
            [TeacherController::class, 'assignSubjects']
        );

        Route::post(
            '/teachers/assign-classes',
            [TeacherController::class, 'assignClasses']
        );


        // =========================
        // EXAMINATIONS
        // =========================

        // List examinations created by the logged-in admin.

        Route::get(
            '/examinations',
            [AdminExaminationController::class, 'index']
        );

        // Create an examination with multiple class-subject assignments.

        Route::post(
            '/examinations',
            [AdminExaminationController::class, 'store']
        );


        // =========================
        // EXAMINATION SUBMISSIONS
        // =========================

        // View examination submissions from teachers.

        Route::get(
            '/examination-submissions',
            [AdminExaminationController::class, 'submissions']
        );

        // Approve or reject submitted marks.

        Route::post(
            '/examination-submissions/{submission}/review',
            [AdminExaminationController::class, 'reviewSubmission']
        );


    });


// =========================
// ANNOUNCEMENTS (SCHOOL ADMIN)
// =========================

Route::middleware(['auth:sanctum', 'role:school_admin'])
    ->group(function () {

        Route::get(
            '/announcements',
            [AnnouncementController::class, 'index']
        );

        Route::post(
            '/announcements',
            [AnnouncementController::class, 'store']
        );

        Route::delete(
            '/announcements/{announcement}',
            [AnnouncementController::class, 'destroy']
        );

    });


// =========================
// TEACHER
// =========================

Route::middleware(['auth:sanctum', 'role:teacher'])
    ->group(function () {

        // =========================
        // TEACHER PROFILE
        // =========================

        Route::get(
            '/teacher/profile',
            [TeacherProfileController::class, 'show']
        );

        Route::put(
            '/teacher/profile',
            [TeacherProfileController::class, 'update']
        );


        // =========================
        // SUBJECTS AND CLASSES
        // =========================

        Route::get(
            '/teacher/subjects',
            [TeacherController::class, 'mySubjects']
        );

        Route::get(
            '/teacher/classes',
            [TeacherController::class, 'myClasses']
        );

        Route::get(
            '/teacher/classes/{class}',
            [TeacherController::class, 'classDetails']
        );


        // =========================
        // STUDENT DETAILS
        // =========================

        Route::get(
            '/teacher/students/{student}',
            [TeacherController::class, 'studentDetails']
        );


        // =========================
        // ATTENDANCE
        // =========================

        Route::get(
            '/teacher/attendance',
            [TeacherAttendanceController::class, 'index']
        );

        Route::post(
            '/teacher/attendance',
            [TeacherAttendanceController::class, 'store']
        );

        Route::get(
            '/teacher/attendance/history',
            [TeacherAttendanceController::class, 'history']
        );


        // =========================
        // TEACHER EXAMINATIONS
        // =========================

        // View examinations assigned to this teacher.

        Route::get(
            '/teacher/examinations',
            [ExaminationController::class, 'index']
        );

        // View students and existing marks for an assignment.

        Route::get(
            '/teacher/examinations/{assignment}/students',
            [ExaminationController::class, 'students']
        );

        // Save or update marks.

        Route::put(
            '/teacher/examinations/{assignment}/marks',
            [ExaminationController::class, 'saveMarks']
        );

        // Submit marks to the School Admin for review.

        Route::post(
            '/teacher/examinations/{assignment}/submit',
            [ExaminationController::class, 'submitMarks']
        );

        // =========================
        // ANNOUNCEMENTS (TEACHER)
        // =========================

        Route::get(
            '/teacher/announcements',
            [AnnouncementController::class, 'teacherIndex']
        );

        Route::post(
            '/teacher/announcements/read-all',
            [AnnouncementController::class, 'markAllAsRead']
        );


        // =========================
        // LESSON PLANS
        // =========================

        Route::apiResource(
            'lesson-plans',
            LessonPlanController::class
        );


        // =========================
        // NOTIFICATIONS
        // =========================

        Route::get(
            '/notifications',
            [NotificationController::class, 'index']
        );

        Route::post(
            '/notifications/{notification}/read',
            [NotificationController::class, 'markAsRead']
        );

        Route::post(
            '/notifications/read-all',
            [NotificationController::class, 'markAllAsRead']
        );

        Route::delete(
            '/notifications/{notification}',
            [NotificationController::class, 'destroy']
        );

    });
