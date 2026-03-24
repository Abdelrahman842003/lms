<?php

declare(strict_types=1);

namespace App\Domains\Application\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Base class for Form Requests with policy-based authorization.
 *
 * This abstract class provides a reusable authorization pattern
 * that integrates with Laravel Policies. Child classes should set
 * $ability and $modelClass properties to enable automatic authorization.
 *
 * @see https://laravel.com/docs/12.x/authorization
 */
abstract class BaseAuthorizedRequest extends FormRequest
{
    /**
     * The ability name for authorization (e.g., 'create', 'update', 'delete').
     * Must be set in child classes.
     */
    protected string $ability = '';

    /**
     * The model class for policy checking.
     * Must be set in child classes.
     */
    protected string $modelClass = '';

    /**
     * Whether to check against a specific model instance.
     * Set to true for update/delete operations that require model instance.
     */
    protected bool $checkInstance = false;

    /**
     * The route parameter name for model ID resolution.
     * Defaults to 'id' but can be overridden for routes using different parameter names.
     */
    protected string $routeParameterName = 'id';

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        if (empty($this->ability) || empty($this->modelClass)) {
            return false;
        }

        $user = auth()->user();

        if (!$user) {
            return false;
        }

        if ($this->checkInstance) {
            $model = $this->getModelInstance();
            return $user->can($this->ability, $model);
        }

        return $user->can($this->ability, $this->modelClass);
    }

    /**
     * Get the model instance for authorization.
     * Override this in child classes for custom model resolution.
     *
     * @return mixed
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    protected function getModelInstance(): mixed
    {
        $id = $this->route($this->routeParameterName) ?? $this->route('model');

        if (!$id) {
            throw new AuthorizationException('Unable to resolve model ID from route.');
        }

        return $this->modelClass::findOrFail($id);
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function failedAuthorization(): void
    {
        throw new AuthorizationException(
            'You are not authorized to perform this action.'
        );
    }

    /**
     * Get the ability name.
     *
     * @return string
     */
    public function getAbility(): string
    {
        return $this->ability;
    }

    /**
     * Get the model class.
     *
     * @return string
     */
    public function getModelClass(): string
    {
        return $this->modelClass;
    }

    /**
     * Check if instance-based authorization is enabled.
     *
     * @return bool
     */
    public function isCheckInstance(): bool
    {
        return $this->checkInstance;
    }
}
