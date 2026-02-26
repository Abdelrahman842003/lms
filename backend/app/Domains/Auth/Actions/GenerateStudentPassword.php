<?php

declare(strict_types=1);

namespace App\Domains\Auth\Actions;

class GenerateStudentPassword
{
    public function execute(string $name, string $phone): string
    {
        // Password is now just the phone number for simplicity
        return $phone;
    }


}
