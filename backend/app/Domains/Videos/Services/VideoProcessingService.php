<?php

declare(strict_types=1);

namespace App\Domains\Videos\Services;

use App\Domains\Videos\Models\Video;
use Symfony\Component\Process\Process;

class VideoProcessingService
{
    public function ensureBinaryAvailable(): void
    {
        $this->runCommand(['which', 'ffmpeg'], 20);
        $this->runCommand(['which', 'ffprobe'], 20);
    }

    /**
     * @return array{duration_seconds:int,width:int,height:int,codec:string,frame_rate:float,size_bytes:int,mime:string}
     */
    public function extractMetadata(string $inputPath): array
    {
        $command = [
            'ffprobe',
            '-v',
            'error',
            '-print_format',
            'json',
            '-show_streams',
            '-show_format',
            $inputPath,
        ];

        $output = $this->runCommand($command, 120);
        $data = json_decode($output, true);

        if (! is_array($data)) {
            throw new \RuntimeException('فشل استخراج metadata من الفيديو.');
        }

        $videoStream = collect($data['streams'] ?? [])->first(fn ($stream) => ($stream['codec_type'] ?? null) === 'video');

        if (! is_array($videoStream)) {
            throw new \RuntimeException('لا يوجد stream فيديو صالح.');
        }

        $duration = (float) ($data['format']['duration'] ?? 0);
        $frameRate = $this->parseFrameRate((string) ($videoStream['avg_frame_rate'] ?? $videoStream['r_frame_rate'] ?? '0/1'));

        return [
            'duration_seconds' => max(0, (int) round($duration)),
            'width' => (int) ($videoStream['width'] ?? 0),
            'height' => (int) ($videoStream['height'] ?? 0),
            'codec' => (string) ($videoStream['codec_name'] ?? 'unknown'),
            'frame_rate' => $frameRate,
            'size_bytes' => (int) ($data['format']['size'] ?? filesize($inputPath) ?: 0),
            'mime' => 'video/mp4',
        ];
    }

    public function transcodeTo720p(string $inputPath, string $outputPath): void
    {
        $command = [
            'ffmpeg',
            '-y',
            '-i',
            $inputPath,
            '-vf',
            'scale=-2:720',
            '-c:v',
            'libx264',
            '-preset',
            'medium',
            '-crf',
            '23',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-movflags',
            '+faststart',
            $outputPath,
        ];

        $this->runCommand($command, 3600);
    }

    public function generateThumbnail(string $inputPath, string $thumbnailPath): void
    {
        $command = [
            'ffmpeg',
            '-y',
            '-ss',
            '00:00:02',
            '-i',
            $inputPath,
            '-frames:v',
            '1',
            '-q:v',
            '2',
            $thumbnailPath,
        ];

        $this->runCommand($command, 300);
    }

    private function parseFrameRate(string $fraction): float
    {
        if (! str_contains($fraction, '/')) {
            return (float) $fraction;
        }

        [$numerator, $denominator] = explode('/', $fraction, 2);
        $n = (float) $numerator;
        $d = (float) $denominator;

        if ($d <= 0) {
            return 0.0;
        }

        return round($n / $d, 3);
    }

    private function runCommand(array $command, int $timeoutSeconds): string
    {
        $process = new Process($command);
        $process->setTimeout($timeoutSeconds);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new \RuntimeException(trim($process->getErrorOutput()) ?: 'فشل تنفيذ أمر معالجة الفيديو.');
        }

        return $process->getOutput();
    }
}
