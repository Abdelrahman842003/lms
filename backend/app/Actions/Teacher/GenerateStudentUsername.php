<?php

namespace App\Actions\Teacher;

use App\Models\Teacher;

class GenerateStudentUsername
{
    public function execute(string $name, Teacher $teacher): string
    {
        $slug = $this->arabicToSlug($name);
        $baseSlug = $slug;
        $counter = 1;
        
        // Check global uniqueness across all students, not just this teacher's
        while (\App\Models\Student::where('username', $slug)->exists()) {
            $slug = $baseSlug . '_' . $counter;
            $counter++;
        }
        
        return $slug;
    }

    private function arabicToSlug(string $text): string
    {
        $text = trim($text);
        
        // Specific replacements for common names/prefixes
        $replacements = [
            'عبدال' => 'abdel',
            'عبد ال' => 'abdel',
            'عيد' => 'eid',
            'الله' => 'allah',
            'ال' => 'el',
        ];
        
        $text = str_replace(array_keys($replacements), array_values($replacements), $text);
        
        $arabic = [
            'ا', 'أ', 'إ', 'آ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ى', 'ة',
            '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'
        ];
        
        $english = [
            'a', 'a', 'e', 'a', 'b', 't', 'th', 'j', 'h', 'kh', 'd', 'th', 'r', 'z', 's', 'sh', 's', 'd', 't', 'z', 'a', 'gh', 'f', 'q', 'k', 'l', 'm', 'n', 'h', 'w', 'i', 'a', 'a',
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ];

        $text = str_replace($arabic, $english, $text);
        
        // Replace non-alphanumeric characters with underscores
        $text = preg_replace('/[^a-zA-Z0-9\s]/', '', $text);
        $text = preg_replace('/\s+/', '_', $text);
        
        return strtolower($text);
    }
}
