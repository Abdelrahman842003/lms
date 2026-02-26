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
    (onClick || clickable) && 'cursor-pointer',
    className
  );

  const colorStyles = {
    inherit: '',
    primary: 'text-primary',
    secondary: 'text-gray-400',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-blue-400',
    muted: 'text-gray-500',
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
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-offset-dark',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ];

  const variantStyles = {
    default: 'bg-white/5 text-gray-300 hover:bg-white/10 focus:ring-gray-500',
    primary: 'bg-primary/20 text-primary hover:bg-primary/30 focus:ring-primary',
    secondary: 'bg-gray-600 text-white hover:bg-gray-500 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 focus:ring-gray-500',
    danger: 'bg-red-500/20 text-red-500 hover:bg-red-500/30 focus:ring-red-500',
  };

  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
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
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  return (
    <span
      className={clsx(
        'inline-flex',
        'items-center',
        gapStyles[gap],
        iconPosition === 'right' && 'flex-row-reverse',
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
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
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
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const bgStyles = {
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-gray-600 text-white',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
    info: 'bg-blue-500/20 text-blue-400',
    default: 'bg-white/10 text-gray-400',
  };

  const shapeStyles = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
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
        'inline-flex',
        'items-center',
        'justify-center',
        sizeStyles[size],
        bgStyles[bg],
        shapeStyles[shape],
        bordered && 'border-2 border-white/10',
        className
      )}
    >
      <Icon size={iconSizes[size]} {...iconProps} />
    </span>
  );
};

export default Icon;
