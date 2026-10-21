<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExaminationSubmission extends Model
{
    protected $fillable = [
        'examination_class_subject_id',
        'submitted_by',
        'status',
        'submitted_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
    ];

    public function classSubject(): BelongsTo
    {
        return $this->belongsTo(
            ExaminationClassSubject::class,
            'examination_class_subject_id'
        );
    }

    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function marks(): HasMany
    {
        return $this->hasMany(StudentMark::class, 'submission_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(
            ExaminationReview::class,
            'examination_submission_id'
        );
    }

    public function latestReview()
    {
        return $this->hasOne(
            ExaminationReview::class,
            'examination_submission_id'
        )->latestOfMany('reviewed_at');
    }
}