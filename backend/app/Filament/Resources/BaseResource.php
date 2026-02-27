<?php

declare(strict_types=1);

namespace App\Filament\Resources;

use Filament\Schemas\Components\Section;
use Filament\Panel;
use Filament\Resources\Resource;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

abstract class BaseResource extends Resource
{
    /**
     * Get the navigation badge with UUID support.
     * Returns count for simple queries, null for complex ones.
     */
    public static function getNavigationBadge(): ?string
    {
        $model = static::getModel();

        if (! class_exists($model)) {
            return null;
        }

        try {
            $query = static::getEloquentQuery();

            return (string) $query->count();
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get the navigation badge color based on count.
     */
    public static function getNavigationBadgeColor(): ?string
    {
        return 'primary';
    }

    /**
     * Build the base Eloquent query using policies.
     * This ensures all resources respect existing authorization.
     */
    public static function getEloquentQuery(): Builder
    {
        $query = parent::getEloquentQuery();
        $model = static::getModel();

        // Apply policy-based filtering if a policy exists
        $policy = static::getPolicyClass();
        if ($policy && method_exists($policy, 'viewAny')) {
            $user = auth()->user();
            if ($user && ! $user->can('viewAny', $model)) {
                $query->whereRaw('1 = 0'); // Return empty result
            }
        }

        return $query;
    }

    /**
     * Get the policy class for this resource.
     */
    protected static function getPolicyClass(): ?string
    {
        $model = static::getModel();
        $modelClass = class_basename($model);
        $policyClass = "App\\Policies\\{$modelClass}Policy";

        return class_exists($policyClass) ? $policyClass : null;
    }

    /**
     * Check if user can perform action on model using existing policies.
     */
    public static function can(string $action, ?Model $record = null): bool
    {
        $model = static::getModel();
        $user = auth()->user();

        if (! $user) {
            return false;
        }

        $policy = static::getPolicyClass();

        // Check Spatie permissions first
        $permission = strtolower(class_basename($model)) . '.' . $action;
        if ($user->can($permission)) {
            return true;
        }

        // Fall back to policy check
        if ($policy && method_exists($policy, $action)) {
            return $user->can($action, $record ?? $model);
        }

        return true;
    }

    /**
     * Create an Arabic form section with RTL support.
     *
     * @param string $label Arabic label for the section
     * @param array $schema Form components
     * @param string|null $description Optional description
     * @param int $columns Number of columns (default 2)
     */
    public static function arabicSection(string $label, array $schema, ?string $description = null, int $columns = 2): Section
    {
        return Section::make($label)
            ->description($description)
            ->schema($schema)
            ->columns($columns)
            ->collapsible()
            ->persistCollapsed()
            ->extraAttributes(['class' => 'arabic-section']);
    }

    /**
     * Get the default form section heading.
     */
    public static function getFormSectionLabel(string $key): string
    {
        $labels = [
            'basic_info' => 'المعلومات الأساسية',
            'contact_info' => 'معلومات التواصل',
            'account_info' => 'معلومات الحساب',
            'academic_info' => 'المعلومات الأكاديمية',
            'settings' => 'الإعدادات',
            'metadata' => 'البيانات الوصفية',
            'permissions' => 'الصلاحيات',
            'attachments' => 'المرفقات',
            'notes' => 'ملاحظات',
        ];

        return $labels[$key] ?? $key;
    }

    /**
     * Get the model label in Arabic.
     */
    public static function getModelLabel(): string
    {
        return static::$modelLabel ?? parent::getModelLabel();
    }

    /**
     * Get the plural model label in Arabic.
     */
    public static function getPluralModelLabel(): string
    {
        return static::$pluralModelLabel ?? parent::getPluralModelLabel();
    }

    /**
     * Get the navigation group in Arabic.
     */
    public static function getNavigationGroup(): ?string
    {
        return static::$navigationGroup ?? null;
    }

    /**
     * Get the navigation label.
     */
    public static function getNavigationLabel(): string
    {
        return static::$navigationLabel ?? static::getPluralModelLabel();
    }

    /**
     * Determine if the resource should be shown in navigation.
     * Checks viewAny policy permission.
     */
    public static function shouldRegisterNavigation(): bool
    {
        $model = static::getModel();

        return static::can('viewAny');
    }

    /**
     * Get the relations available for this resource.
     */
    public static function getRelations(): array
    {
        return [];
    }

    /**
     * Get the widgets available for this resource.
     */
    public static function getWidgets(): array
    {
        return [];
    }

    /**
     * Get the pages available for this resource.
     * Each subclass must override this method with proper PageRegistration objects.
     */
    public static function getPages(): array
    {
        $model = class_basename(static::getModel());
        $resourceNamespace = static::class;

        $pages = [];
        $listClass = $resourceNamespace . '\\Pages\\List' . \Illuminate\Support\Str::plural($model);
        $createClass = $resourceNamespace . '\\Pages\\Create' . $model;
        $editClass = $resourceNamespace . '\\Pages\\Edit' . $model;
        $viewClass = $resourceNamespace . '\\Pages\\View' . $model;

        if (class_exists($listClass)) {
            $pages['index'] = $listClass::route('/');
        }
        if (class_exists($createClass)) {
            $pages['create'] = $createClass::route('/create');
        }
        if (class_exists($editClass)) {
            $pages['edit'] = $editClass::route('/{record}/edit');
        }
        if (class_exists($viewClass)) {
            $pages['view'] = $viewClass::route('/{record}');
        }

        return $pages;
    }

    /**
     * Get the slug for this resource.
     */
    public static function getSlug(?\Filament\Panel $panel = null): string
    {
        return static::$slug ?? strtolower(class_basename(static::getModel()));
    }

    /**
     * Get the record title attribute.
     */
    public static function getRecordTitleAttribute(): ?string
    {
        return static::$recordTitleAttribute ?? 'name';
    }

    /**
     * Get the global search result title.
     */
    public static function getGlobalSearchResultTitle(Model $record): string
    {
        $attribute = static::getRecordTitleAttribute();

        return $record->{$attribute} ?? (string) $record->getKey();
    }

    /**
     * Get the global search result details.
     */
    public static function getGlobalSearchResultDetails(Model $record): array
    {
        return [];
    }

    /**
     * Get the global search eager loading relations.
     */
    public static function getGlobalSearchEloquentQuery(): Builder
    {
        return static::getEloquentQuery();
    }

    /**
     * Get the global search results limit.
     */
    public static function getGlobalSearchResultsLimit(): int
    {
        return 10;
    }

    /**
     * Authorization check for creating records.
     */
    public static function canCreate(): bool
    {
        return static::can('create');
    }

    /**
     * Authorization check for editing records.
     */
    public static function canEdit(Model $record): bool
    {
        return static::can('update', $record);
    }

    /**
     * Authorization check for deleting records.
     */
    public static function canDelete(Model $record): bool
    {
        return static::can('delete', $record);
    }

    /**
     * Authorization check for viewing records.
     */
    public static function canView(Model $record): bool
    {
        return static::can('view', $record);
    }

    /**
     * Authorization check for viewing any records.
     */
    public static function canViewAny(): bool
    {
        return static::can('viewAny');
    }
}