<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    protected $fillable = [
        'school_id',
        'admission_number',
        'first_name',
        'middle_name',
        'last_name',
        'gender',
        'date_of_birth',
        'phone',
        'address',
        'class_name',
        'stream',
    ];

    /**
     * Student belongs to a school.
     */
    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}