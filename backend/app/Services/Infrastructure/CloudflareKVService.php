<?php

namespace App\Services\Infrastructure;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class CloudflareKVService
{
    private Client $client;
    private string $accountId;
    private string $namespaceId;
    private string $apiToken;

    public function __construct()
    {
        $this->client = new Client();
        $this->accountId = config('services.cloudflare.kv.account_id');
        $this->namespaceId = config('services.cloudflare.kv.namespace_id');
        $this->apiToken = config('services.cloudflare.kv.api_token');
    }

    /**
     * Set a key-value pair in Cloudflare KV
     * 
     * @param string $key
     * @param mixed $value
     * @return bool
     */
    public function set(string $key, $value): bool
    {
        try {
            $url = $this->buildUrl($key);
            
            $response = $this->client->put($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                    'Content-Type' => 'application/json',
                ],
                'body' => json_encode($value),
            ]);

            return $response->getStatusCode() === 200;
        } catch (GuzzleException $e) {
            \Log::error('Cloudflare KV Set Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get value by key from Cloudflare KV
     * 
     * @param string $key
     * @return mixed|null
     */
    public function get(string $key)
    {
        try {
            $url = $this->buildUrl($key);
            
            $response = $this->client->get($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                ],
            ]);

            if ($response->getStatusCode() === 200) {
                return json_decode($response->getBody()->getContents(), true);
            }

            return null;
        } catch (GuzzleException $e) {
            \Log::error('Cloudflare KV Get Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a key from Cloudflare KV
     * 
     * @param string $key
     * @return bool
     */
    public function delete(string $key): bool
    {
        try {
            $url = $this->buildUrl($key);
            
            $response = $this->client->delete($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiToken,
                ],
            ]);

            return $response->getStatusCode() === 200;
        } catch (GuzzleException $e) {
            \Log::error('Cloudflare KV Delete Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Build the API URL for a key
     * 
     * @param string $key
     * @return string
     */
    private function buildUrl(string $key): string
    {
        return sprintf(
            'https://api.cloudflare.com/client/v4/accounts/%s/storage/kv/namespaces/%s/values/%s',
            $this->accountId,
            $this->namespaceId,
            urlencode($key)
        );
    }

    /**
     * Generate KV key for avatar
     * 
     * @param string $type (teacher, student, secretary)
     * @param string $id
     * @return string
     */
    public static function generateAvatarKey(string $type, string $id): string
    {
        return "{$type}_{$id}_avatar";
    }
}
