<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Services;

use App\Domains\Application\Services\InputSanitizer;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class InputSanitizerTest extends TestCase
{
    #[Test]
    public function it_sanitizes_anchor_with_title_attribute_without_throwing(): void
    {
        $sanitizer = new InputSanitizer();

        $result = $sanitizer->sanitizeHtml('<a href="https://example.com" title="example">link</a>');

        $this->assertNotNull($result);
        $this->assertStringContainsString('href="https://example.com"', $result);
        $this->assertStringContainsString('title="example"', $result);
        $this->assertStringContainsString('>link</a>', $result);
    }
}
