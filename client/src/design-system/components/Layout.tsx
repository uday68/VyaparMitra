/**
 * Layout Components
 * 
 * Responsive layout components that provide consistent container and layout patterns
 * across all pages, following mobile-first design principles.
 */

import React from 'react';
import { cn } from '../utils/cn';
import { getContainerClass, getResponsiveSpacing } from '../utils/responsive';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: 'mobile' | 'tablet' | 'desktop' | 'wide';
  className?: string;
}

/**
 * Container component with responsive max-width and padding
 */
export function Container({ 
  children, 
  maxWidth = 'desktop', 
  className 
}: ContainerProps) {
  return (
    <div className={cn(getContainerClass(maxWidth), className)}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  spacing?: 'element' | 'component' | 'section';
  className?: string;
}

/**
 * Section component with responsive spacing
 */
export function Section({ 
  children, 
  spacing = 'section', 
  className 
}: SectionProps) {
  const spacingClass = getResponsiveSpacing(spacing, 'py');
  
  return (
    <section className={cn(spacingClass, className)}>
      {children}
    </section>
  );
}

interface GridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  gap?: 'element' | 'component' | 'section';
  className?: string;
}

/**
 * Responsive grid component
 */
export function Grid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'component',
  className 
}: GridProps) {
  const gapClass = getResponsiveSpacing(gap, 'gap');
  
  // Generate grid column classes
  const gridCols = [
    cols.mobile && `grid-cols-${cols.mobile}`,
    cols.tablet && `md:grid-cols-${cols.tablet}`,
    cols.desktop && `lg:grid-cols-${cols.desktop}`,
    cols.wide && `xl:grid-cols-${cols.wide}`
  ].filter(Boolean).join(' ');
  
  return (
    <div className={cn('grid', gridCols, gapClass, className)}>
      {children}
    </div>
  );
}

interface FlexProps {
  children: React.ReactNode;
  direction?: {
    mobile?: 'row' | 'col';
    tablet?: 'row' | 'col';
    desktop?: 'row' | 'col';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  gap?: 'element' | 'component' | 'section';
  wrap?: boolean;
  className?: string;
}

/**
 * Responsive flex component
 */
export function Flex({ 
  children, 
  direction = { mobile: 'col', tablet: 'row' },
  align = 'start',
  justify = 'start',
  gap = 'component',
  wrap = false,
  className 
}: FlexProps) {
  const gapClass = getResponsiveSpacing(gap, 'gap');
  
  // Generate flex direction classes
  const directionClasses = [
    direction.mobile && `flex-${direction.mobile}`,
    direction.tablet && `md:flex-${direction.tablet}`,
    direction.desktop && `lg:flex-${direction.desktop}`
  ].filter(Boolean).join(' ');
  
  const alignClass = `items-${align}`;
  const justifyClass = `justify-${justify}`;
  const wrapClass = wrap ? 'flex-wrap' : '';
  
  return (
    <div className={cn(
      'flex', 
      directionClasses, 
      alignClass, 
      justifyClass, 
      wrapClass,
      gapClass, 
      className
    )}>
      {children}
    </div>
  );
}

interface StackProps {
  children: React.ReactNode;
  spacing?: 'element' | 'component' | 'section';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

/**
 * Vertical stack component with consistent spacing
 */
export function Stack({ 
  children, 
  spacing = 'component', 
  align = 'stretch',
  className 
}: StackProps) {
  const spacingClass = getResponsiveSpacing(spacing, 'gap');
  const alignClass = `items-${align}`;
  
  return (
    <div className={cn('flex flex-col', alignClass, spacingClass, className)}>
      {children}
    </div>
  );
}

interface PageLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'mobile' | 'tablet' | 'desktop' | 'wide';
  className?: string;
}

/**
 * Full page layout component with header and footer
 */
export function PageLayout({ 
  children, 
  header, 
  footer, 
  maxWidth = 'desktop',
  className 
}: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {header && (
        <header className="flex-shrink-0">
          <Container maxWidth={maxWidth}>
            {header}
          </Container>
        </header>
      )}
      
      <main className="flex-1">
        <Container maxWidth={maxWidth}>
          {children}
        </Container>
      </main>
      
      {footer && (
        <footer className="flex-shrink-0">
          <Container maxWidth={maxWidth}>
            {footer}
          </Container>
        </footer>
      )}
    </div>
  );
}

interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  className?: string;
}

/**
 * Responsive image component
 */
export function ResponsiveImage({ 
  src, 
  alt, 
  sizes = { mobile: '100vw', tablet: '50vw', desktop: '33vw' },
  className 
}: ResponsiveImageProps) {
  // Generate sizes attribute for responsive images
  const sizesAttr = [
    `(max-width: 768px) ${sizes.mobile || '100vw'}`,
    `(max-width: 1024px) ${sizes.tablet || '50vw'}`,
    sizes.desktop || '33vw'
  ].join(', ');
  
  return (
    <img 
      src={src} 
      alt={alt} 
      sizes={sizesAttr}
      className={cn('w-full h-auto', className)}
    />
  );
}

interface HideProps {
  children: React.ReactNode;
  below?: 'tablet' | 'desktop' | 'wide';
  above?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Utility component to hide content at specific breakpoints
 */
export function Hide({ children, below, above }: HideProps) {
  let className = '';
  
  if (below) {
    switch (below) {
      case 'tablet':
        className = 'hidden md:block';
        break;
      case 'desktop':
        className = 'hidden lg:block';
        break;
      case 'wide':
        className = 'hidden xl:block';
        break;
    }
  }
  
  if (above) {
    switch (above) {
      case 'mobile':
        className = 'md:hidden';
        break;
      case 'tablet':
        className = 'lg:hidden';
        break;
      case 'desktop':
        className = 'xl:hidden';
        break;
    }
  }
  
  return <div className={className}>{children}</div>;
}

interface ShowProps {
  children: React.ReactNode;
  from?: 'tablet' | 'desktop' | 'wide';
  until?: 'tablet' | 'desktop' | 'wide';
}

/**
 * Utility component to show content only at specific breakpoints
 */
export function Show({ children, from, until }: ShowProps) {
  let className = 'hidden';
  
  if (from && !until) {
    switch (from) {
      case 'tablet':
        className = 'hidden md:block';
        break;
      case 'desktop':
        className = 'hidden lg:block';
        break;
      case 'wide':
        className = 'hidden xl:block';
        break;
    }
  } else if (!from && until) {
    switch (until) {
      case 'tablet':
        className = 'block md:hidden';
        break;
      case 'desktop':
        className = 'block lg:hidden';
        break;
      case 'wide':
        className = 'block xl:hidden';
        break;
    }
  } else if (from && until) {
    // Show only between breakpoints
    const fromClass = from === 'tablet' ? 'md:' : from === 'desktop' ? 'lg:' : 'xl:';
    const untilClass = until === 'tablet' ? 'md:' : until === 'desktop' ? 'lg:' : 'xl:';
    className = `hidden ${fromClass}block ${untilClass}hidden`;
  }
  
  return <div className={className}>{children}</div>;
}