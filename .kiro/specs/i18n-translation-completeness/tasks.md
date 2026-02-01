# Implementation Plan: i18n Translation Completeness

## Overview

This implementation plan creates a comprehensive system for managing translation completeness in VyaparMitra. The approach focuses on automated discovery, validation, and management of translation keys across all 12 supported languages, with special emphasis on fixing vendor dashboard translation issues.

## Tasks

- [ ] 1. Set up translation management infrastructure
  - Create directory structure for translation tools
  - Set up TypeScript configuration for translation utilities
  - Install required dependencies (fast-check for property testing)
  - Create base interfaces and types for translation management
  - _Requirements: 5.1, 5.5_

- [ ] 2. Implement Translation Key Scanner
  - [ ] 2.1 Create core scanning functionality
    - Write TranslationKeyScanner class with file parsing capabilities
    - Implement regex-based extraction of t('key') and t("key") patterns
    - Add support for nested keys with dot notation
    - Add parameter detection for interpolation syntax {{param}}
    - _Requirements: 1.1, 5.1_
  
  - [ ] 2.2 Write property test for translation key discovery
    - **Property 1: Translation Key Discovery Completeness**
    - **Validates: Requirements 1.1, 5.1**
  
  - [ ] 2.3 Add context extraction and file analysis
    - Extract usage context around translation keys
    - Track file paths and line numbers for each key
    - Implement namespace detection from key patterns
    - _Requirements: 1.1_

- [ ] 3. Implement Missing Key Detector
  - [ ] 3.1 Create translation file loader and comparator
    - Write TranslationFileLoader to read all 12 language files
    - Implement key comparison logic across languages
    - Add missing key categorization by namespace and priority
    - _Requirements: 1.2, 1.3_
  
  - [ ] 3.2 Write property test for missing key detection
    - **Property 2: Missing Key Detection Accuracy**
    - **Validates: Requirements 1.2, 3.1**
  
  - [ ] 3.3 Implement priority classification system
    - Create priority rules for vendor-specific keys
    - Add namespace-based priority assignment
    - Implement usage frequency analysis for priority
    - _Requirements: 1.3, 1.4_
  
  - [ ] 3.4 Write property test for priority classification
    - **Property 12: Priority Classification Accuracy**
    - **Validates: Requirements 1.3, 1.4**

- [ ] 4. Create Translation Generator
  - [ ] 4.1 Implement placeholder translation generation
    - Create meaningful placeholder templates for each language
    - Add context-aware placeholder generation
    - Implement parameter preservation in placeholders
    - _Requirements: 2.1, 5.2_
  
  - [ ] 4.2 Write property test for placeholder generation
    - **Property 11: Placeholder Translation Generation**
    - **Validates: Requirements 5.2**
  
  - [ ] 4.3 Add template-based translation system
    - Create translation templates for common patterns
    - Implement template matching and application
    - Add vendor-specific business terminology templates
    - _Requirements: 2.1, 2.2_
  
  - [ ] 4.4 Write property test for parameter preservation
    - **Property 4: Parameter Interpolation Preservation**
    - **Validates: Requirements 2.4, 3.4**

- [ ] 5. Checkpoint - Core functionality validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Validation Engine
  - [ ] 6.1 Create translation file validator
    - Write JSON structure validation
    - Implement key consistency checking across languages
    - Add parameter interpolation validation
    - Create placeholder detection logic
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 6.2 Write property test for validation accuracy
    - **Property 5: Validation Report Accuracy**
    - **Validates: Requirements 3.2, 3.5, 4.5**
  
  - [ ] 6.3 Add completion percentage calculation
    - Calculate completion rates per language
    - Generate detailed validation reports
    - Add critical key identification
    - _Requirements: 3.5_
  
  - [ ] 6.4 Write property test for JSON structure integrity
    - **Property 6: JSON Structure Integrity**
    - **Validates: Requirements 3.3, 8.4**

- [ ] 7. Implement File Manager
  - [ ] 7.1 Create safe file update system
    - Write atomic file operations with backup
    - Implement merge logic for existing translations
    - Add rollback capability for failed operations
    - Create file formatting preservation
    - _Requirements: 2.3, 5.3_
  
  - [ ] 7.2 Write property test for file update consistency
    - **Property 3: Translation File Update Consistency**
    - **Validates: Requirements 2.1, 2.3, 5.3**
  
  - [ ] 7.3 Add translation structure organization
    - Implement namespace-based key organization
    - Add alphabetical sorting within namespaces
    - Create consistent formatting across all files
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 7.4 Write property test for structure organization
    - **Property 10: Translation Structure Organization**
    - **Validates: Requirements 8.1, 8.2, 8.5**

- [ ] 8. Create Monitoring System
  - [ ] 8.1 Implement build-time validation
    - Create build script integration
    - Add critical key validation
    - Implement build failure on missing keys
    - Generate clear error messages
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [ ] 8.2 Write property test for build integration
    - **Property 7: Build Integration Validation**
    - **Validates: Requirements 4.2, 4.4**
  
  - [ ] 8.3 Add development-time monitoring
    - Create pre-commit hook for translation validation
    - Add real-time key usage detection
    - Implement test-time validation
    - _Requirements: 4.1, 4.3_

- [ ] 9. Fix existing missing vendor translation keys
  - [ ] 9.1 Run comprehensive audit on current codebase
    - Scan all React components for translation key usage
    - Generate complete missing key report
    - Prioritize vendor dashboard keys
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ] 9.2 Add missing vendor dashboard translations
    - Add all vendor.sections.* keys (shopLocation, qrCode, businessOverview, etc.)
    - Add all vendor.quickActions.* keys (addProduct, viewOrders, analytics, etc.)
    - Add all vendor.negotiations.* keys (viewAll, accept, counter, reject, etc.)
    - Add all vendor.voice.* keys (ready, listening, tryVoice, stop)
    - _Requirements: 7.1, 7.4_
  
  - [ ] 9.3 Add missing vendor analytics translations
    - Add all vendor.analytics.* keys (successRate, avgTime, avgDiscount, etc.)
    - Add performance metric translations
    - Add voice vs text performance translations
    - _Requirements: 7.2_
  
  - [ ] 9.4 Complete all 12 language files with vendor translations
    - Generate appropriate translations for all missing vendor keys
    - Ensure business terminology is contextually appropriate
    - Validate parameter interpolation across all languages
    - _Requirements: 2.1, 7.5_

- [ ] 10. Checkpoint - Translation completeness validation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Create command-line tools and scripts
  - [ ] 11.1 Create translation audit CLI tool
    - Build command-line interface for running audits
    - Add options for different scan modes and filters
    - Create formatted output for missing key reports
    - _Requirements: 1.5, 5.1_
  
  - [ ] 11.2 Create translation update CLI tool
    - Build tool for batch translation updates
    - Add options for specific languages or namespaces
    - Create backup and rollback functionality
    - _Requirements: 5.2, 5.3_
  
  - [ ] 11.3 Add validation and monitoring scripts
    - Create validation script for CI/CD integration
    - Add completion reporting script
    - Create pre-commit hook script
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 12. Integration and testing
  - [ ] 12.1 Integrate with existing build process
    - Add translation validation to package.json scripts
    - Update CI/CD pipeline with translation checks
    - Configure build failure on missing critical keys
    - _Requirements: 4.2_
  
  - [ ] 12.2 Write integration tests
    - Test full workflow from discovery to file updates
    - Test multi-language consistency validation
    - Test error handling and recovery scenarios
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 12.3 Write property test for console error elimination
    - **Property 8: Console Error Elimination**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
  
  - [ ] 12.4 Write property test for vendor dashboard completeness
    - **Property 9: Vendor Dashboard Translation Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ] 13. Documentation and maintenance
  - [ ] 13.1 Create developer documentation
    - Document translation key naming conventions
    - Create guide for adding new translations
    - Document CLI tool usage and options
    - _Requirements: 8.2_
  
  - [ ] 13.2 Create maintenance procedures
    - Document regular audit procedures
    - Create troubleshooting guide for common issues
    - Document backup and recovery procedures
    - _Requirements: 5.5_

- [ ] 14. Final validation and deployment
  - [ ] 14.1 Run comprehensive system validation
    - Execute all property-based tests
    - Validate all 12 language files for completeness
    - Test vendor dashboard in all languages
    - Verify console error elimination
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 14.2 Deploy translation management system
    - Update development workflow documentation
    - Train team on new translation tools
    - Set up monitoring and alerting for translation issues
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 15. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Focus on vendor dashboard translations as highest priority
- All 12 languages must be supported: as, bn, en, gu, hi, kn, ml, mr, or, pa, ta, te