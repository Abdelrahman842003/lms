/**
 * Icon Component
 * Centralized FontAwesome icon component for consistency
 * Wraps FontAwesome icons with standardized sizing and styling
 */

import React from 'react';
import { clsx } from 'clsx';

// Common icon name mapping for type safety and convenience
export type IconName =
  // Navigation
  | 'home' | 'dashboard' | 'users' | 'user' | 'user-circle' | 'user-tie' | 'user-graduate'
  | 'sign-out-alt' | 'sign-in-alt' | 'arrow-left' | 'arrow-right' | 'arrow-up' | 'arrow-down'
  | 'chevron-left' | 'chevron-right' | 'chevron-up' | 'chevron-down' | 'bars' | 'times' | 'menu'
  // Actions
  | 'plus' | 'minus' | 'edit' | 'trash' | 'save' | 'download' | 'upload' | 'sync' | 'refresh'
  | 'search' | 'filter' | 'sort' | 'cog' | 'sliders-h' | 'ellipsis-v' | 'ellipsis-h'
  // Status
  | 'check' | 'check-circle' | 'times' | 'times-circle' | 'exclamation' | 'exclamation-circle'
  | 'exclamation-triangle' | 'info' | 'info-circle' | 'question' | 'question-circle'
  | 'spinner' | 'circle-notch' | 'clock' | 'hourglass' | 'ban'
  // Communication
  | 'envelope' | 'bell' | 'comment' | 'comments' | 'phone' | 'microphone' | 'microphone-slash'
  | 'paper-plane' | 'inbox' | 'reply' | 'share'
  // Files & Documents
  | 'file' | 'file-alt' | 'file-pdf' | 'file-word' | 'file-excel' | 'file-image'
  | 'folder' | 'folder-open' | 'clipboard' | 'clipboard-list' | 'copy' | 'paste'
  // Media
  | 'image' | 'video' | 'music' | 'play' | 'pause' | 'stop' | 'volume-up' | 'volume-mute'
  // Education
  | 'book' | 'book-open' | 'graduation-cap' | 'chalkboard' | 'chalkboard-teacher'
  | 'university' | 'school' | 'pencil-alt' | 'pen' | 'calculator' | 'flask'
  // Finance
  | 'money-bill' | 'money-bill-wave' | 'credit-card' | 'wallet' | 'coins' | 'receipt'
  | 'chart-line' | 'chart-bar' | 'chart-pie' | 'percentage'
  // Misc
  | 'calendar' | 'calendar-alt' | 'clock' | 'history' | 'star' | 'star-half' | 'heart'
  | 'thumbs-up' | 'thumbs-down' | 'flag' | 'bookmark' | 'tag' | 'tags' | 'qrcode'
  | 'mobile-alt' | 'desktop' | 'laptop' | 'tablet-alt' | 'wifi' | 'signal'
  | 'lock' | 'unlock' | 'key' | 'shield-alt' | 'eye' | 'eye-slash'
  | 'camera' | 'print' | 'truck' | 'map-marker-alt' | 'globe' | 'language'
  | 'moon' | 'sun' | 'adjust' | 'palette' | 'crown' | 'medal' | 'trophy'
  | 'fire' | 'bolt' | 'tachometer-alt' | 'gauge' | 'speed' | 'chart-line'
  // Custom string for any other icon
  | (string & {});

// Icon set/style mapping
export type IconSet = 'solid' | 'regular' | 'light' | 'duotone' | 'brands';

export interface IconProps {
  /** Icon name (from predefined list or any FontAwesome icon) */
  name: IconName;
  /** Icon set/style */
  set?: IconSet;
  /** Icon size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2x' | '3x' | '4x' | '5x' | number;
  /** Fixed width (aligns icons) */
  fixedWidth?: boolean;
  /** Spin animation */
  spin?: boolean;
  /** Pulse animation */
  pulse?: boolean;
  /** Rotate the icon */
  rotate?: 90 | 180 | 270;
  /** Flip the icon */
  flip?: 'horizontal' | 'vertical' | 'both';
  /** Additional className */
  className?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Title for accessibility */
  title?: string;
  /** ARIA label */
  ariaLabel?: string;
  /** Role */
  role?: string;
  /** Whether icon is inside a button/link (adds cursor pointer) */
  clickable?: boolean;
  /** Color variant */
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

export const Icon: React.FC<IconProps> = ({
  name,
  set = 'solid',
  size = 'md',
  fixedWidth = false,
  spin = false,
  pulse = false,
  rotate,
  flip,
  className,
  onClick,
  title,
  ariaLabel,
  role = 'img',
  clickable = false,
  color = 'inherit',
}) => {
  // Build FontAwesome class
  const setPrefix = {
    solid: 'fas',
    regular: 'far',
    light: 'fal',
    duotone: 'fad',
    brands: 'fab',
  };

  const sizeClass = typeof size === 'number' ? `fa-${size}x` : `fa-${size}`;

  const iconClasses = clsx(
    setPrefix[set],
    `fa-${name}`,
    sizeClass,
    fixedWidth && 'fa-fw',
    spin && 'fa-spin',
    pulse && 'fa-pulse',
    rotate && `fa-rotate-${rotate}`,
    flip && `fa-flip-${flip}`,
    (onClick || clickable) && 'ux-cursor-pointer',
    className
  );

  const colorStyles = {
    inherit: '',
    primary: 'ux-text-primary',
    secondary: 'ux-text-gray-400',
    success: 'ux-text-success',
    warning: 'ux-text-warning',
    danger: 'ux-text-danger',
    info: 'ux-text-blue-400',
    muted: 'ux-text-gray-500',
  };

  return (
    <i
      className={clsx(iconClasses, colorStyles[color])}
      onClick={onClick}
      title={title}
      role={role}
      aria-label={ariaLabel || title || name}
    />
  );
};

/**
 * Icon Button Component
 * Button with an icon
 */
export interface IconButtonProps extends Omit<IconProps, 'onClick'> {
  /** Button variant */
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  buttonSize?: 'sm' | 'md' | 'lg';
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Additional button className */
  buttonClassName?: string;
  /** Tooltip text */
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'default',
  buttonSize = 'md',
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  buttonClassName,
  tooltip,
  name,
  spin,
  ...iconProps
}) => {
  const baseStyles = [
    'ux-inline-flex',
    'ux-items-center',
    'ux-justify-center',
    'ux-rounded-lg',
    'ux-transition-all',
    'ux-duration-200',
    'ux-disabled-opacity-50',
    'ux-disabled-cursor-not-allowed',
  ];

  const variantStyles = {
    default: 'ux-bg-white-5 ux-text-gray-300 ux-hover-bg-white-10',
    primary: 'ux-bg-primary-20 ux-text-primary ux-hover-bg-primary-30',
    secondary: 'ux-bg-gray-600 ux-text-white ux-hover-bg-gray-500',
    ghost: 'ux-bg-transparent ux-text-gray-400 ux-hover-text-white ux-hover-bg-white-5',
    danger: 'ux-bg-red-500-20 ux-text-red-500 ux-hover-bg-red-500-30',
  };

  const sizeStyles = {
    sm: 'ux-w-8 ux-h-8',
    md: 'ux-w-10 ux-h-10',
    lg: 'ux-w-12 ux-h-12',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={tooltip}
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[buttonSize],
        buttonClassName
      )}
    >
      <Icon
        name={name}
        spin={loading || spin}
        {...iconProps}
      />
    </button>
  );
};

/**
 * Icon with Text Component
 * Icon paired with text label
 */
export interface IconTextProps extends IconProps {
  /** Text label */
  text: string;
  /** Icon position relative to text */
  iconPosition?: 'left' | 'right';
  /** Gap between icon and text */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional wrapper className */
  wrapperClassName?: string;
  /** Text className */
  textClassName?: string;
}

export const IconText: React.FC<IconTextProps> = ({
  text,
  iconPosition = 'left',
  gap = 'md',
  wrapperClassName,
  textClassName,
  ...iconProps
}) => {
  const gapStyles = {
    sm: 'ux-gap-1',
    md: 'ux-gap-2',
    lg: 'ux-gap-3',
  };

  return (
    <span
      className={clsx(
        'ux-inline-flex',
        'ux-items-center',
        gapStyles[gap],
        iconPosition === 'right' && 'ux-flex-row-reverse',
        wrapperClassName
      )}
    >
      <Icon {...iconProps} />
      <span className={textClassName}>{text}</span>
    </span>
  );
};

/**
 * Icon Stack Component
 * Multiple icons stacked (e.g., for layered effects)
 */
export interface IconStackProps {
  /** Icons to stack */
  icons: Array<{
    name: IconName;
    set?: IconSet;
    className?: string;
  }>;
  /** Stack size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

export const IconStack: React.FC<IconStackProps> = ({
  icons,
  size = 'md',
  className,
}) => {
  const sizeStyles = {
    sm: 'ux-text-sm',
    md: 'ux-text-base',
    lg: 'ux-text-lg',
  };

  return (
    <span className={clsx('fa-stack', sizeStyles[size], className)}>
      {icons.map((icon, index) => (
        <Icon
          key={index}
          name={icon.name}
          set={icon.set}
          className={clsx('fa-stack', index === 0 ? '1x' : '2x', icon.className)}
        />
      ))}
    </span>
  );
};

/**
 * Avatar with Icon Component
 * Circular avatar containing an icon
 */
export interface IconAvatarProps extends Omit<IconProps, 'size'> {
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Background color variant */
  bg?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  /** Shape variant */
  shape?: 'circle' | 'square' | 'rounded';
  /** Border style */
  bordered?: boolean;
}

export const IconAvatar: React.FC<IconAvatarProps> = ({
  size = 'md',
  bg = 'default',
  shape = 'circle',
  bordered = false,
  className,
  ...iconProps
}) => {
  const sizeStyles = {
    xs: 'ux-w-6 ux-h-6',
    sm: 'ux-w-8 ux-h-8',
    md: 'ux-w-10 ux-h-10',
    lg: 'ux-w-12 ux-h-12',
    xl: 'ux-w-16 ux-h-16',
  };

  const bgStyles = {
    primary: 'ux-bg-primary-20 ux-text-primary',
    secondary: 'ux-bg-gray-600 ux-text-white',
    success: 'ux-bg-success-20 ux-text-success',
    warning: 'ux-bg-warning-20 ux-text-warning',
    danger: 'ux-bg-danger-20 ux-text-danger',
    info: 'ux-bg-blue-500-20 ux-text-blue-400',
    default: 'ux-bg-white-10 ux-text-gray-400',
  };

  const shapeStyles = {
    circle: 'ux-rounded-full',
    square: 'ux-rounded-none',
    rounded: 'ux-rounded-lg',
  };

  const iconSizes = {
    xs: 'xs',
    sm: 'sm',
    md: 'sm',
    lg: 'md',
    xl: 'lg',
  } as const;

  return (
    <span
      className={clsx(
        'ux-inline-flex',
        'ux-items-center',
        'ux-justify-center',
        sizeStyles[size],
        bgStyles[bg],
        shapeStyles[shape],
        bordered && 'ux-border-2 ux-border-white-10',
        className
      )}
    >
      <Icon size={iconSizes[size]} {...iconProps} />
    </span>
  );
};

export default Icon;
