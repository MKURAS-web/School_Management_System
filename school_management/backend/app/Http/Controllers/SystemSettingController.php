<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
{
    public function index()
    {
        return response()->json(SystemSetting::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255|unique:system_settings,key',
            'value' => 'nullable',
            'description' => 'nullable|string|max:255',
        ]);

        $setting = SystemSetting::create($validated);

        return response()->json([
            'message' => 'Setting created.',
            'setting' => $setting,
        ], 201);
    }

    public function show(SystemSetting $systemSetting)
    {
        return response()->json($systemSetting);
    }

    public function update(Request $request, SystemSetting $systemSetting)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255|unique:system_settings,key,' . $systemSetting->id,
            'value' => 'nullable',
            'description' => 'nullable|string|max:255',
        ]);

        $systemSetting->update($validated);

        return response()->json([
            'message' => 'Setting updated.',
            'setting' => $systemSetting,
        ]);
    }

    public function destroy(SystemSetting $systemSetting)
    {
        $systemSetting->delete();

        return response()->json([
            'message' => 'Setting deleted.',
        ]);
    }
}
