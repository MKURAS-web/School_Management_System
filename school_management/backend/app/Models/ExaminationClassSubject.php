<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExaminationClassSubject extends Model
{
    protected $fillable = [
        'examination_id',
        'class_id',
        'subject_id',
        'teacher_id',
        'maximum_marks',
    ];

    protected $casts = [
        'maximum_marks' => 'decimal:2',
    ];

    public function examination(): BelongsTo
    {
        return $this->belongsTo(Examination::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function submission(): HasOne
    {
        return $this->hasOne(
            ExaminationSubmission::class,
            'examination_class_subject_id'
        );
    }
}