<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Examination extends Model
{
    protected $fillable = [
        'school_id',
        'created_by',
        'class_id',
        'subject_id',
        'teacher_id',
        'title',
        'exam_type',
        'exam_date',
        'submission_deadline',
        'academic_year',
        'total_marks',
        'description',
        'status',
    ];

    protected $casts = [
        'exam_date' => 'date:Y-m-d',
        'submission_deadline' => 'datetime',
        'total_marks' => 'decimal:2',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Legacy relationship retained for existing examination records.
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    // Legacy relationship retained for existing examination records.
    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    // Legacy relationship retained for existing examination records.
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function classSubjects(): HasMany
    {
        return $this->hasMany(ExaminationClassSubject::class);
    }

    public function studentMarks(): HasMany
    {
        return $this->hasMany(StudentMark::class);
    }
}