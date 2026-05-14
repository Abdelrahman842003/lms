<?php

declare(strict_types=1);

namespace Tests\Unit\Domains\Videos\Services;

use App\Domains\Videos\Services\CloudflareStreamService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CloudflareStreamServiceTest extends TestCase
{
    private CloudflareStreamService $service;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('cloudflare.stream.account_id', 'test_account_id');
        Config::set('cloudflare.stream.api_token', 'test_token');
        Config::set('cloudflare.stream.signing_key', "----BEGIN PRIVATE KEY----\nMC4CAQAwBQYDK2VwBCIEIPz5...\n----END PRIVATE KEY----");
        Config::set('cloudflare.stream.key_id', 'test_key_id');

        $this->service = new CloudflareStreamService();
    }

    public function test_create_direct_upload_url_returns_valid_response(): void
    {
        Http::fake([
            '*/direct_upload' => Http::response([
                'result' => [
                    'uploadURL' => 'https://upload.cloudflare.com/test',
                    'uid' => 'test_uid',
                ]
            ], 200)
        ]);

        $result = $this->service->createDirectUploadUrl(3600);

        $this->assertEquals('https://upload.cloudflare.com/test', $result['upload_url']);
        $this->assertEquals('test_uid', $result['stream_uid']);
    }

    public function test_delete_video_returns_true_on_success(): void
    {
        Http::fake([
            '*/test_uid' => Http::response([], 200)
        ]);

        $result = $this->service->deleteVideo('test_uid');

        $this->assertTrue($result);
    }
}
