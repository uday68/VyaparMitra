# VyaparMitra - Kiro Configuration Documentation

This directory contains configuration files and documentation for the Kiro AI assistant to effectively work with the VyaparMitra project.

## 📁 Directory Structure

```
.kiro/
├── README.md                 # This documentation file
├── settings/                 # Kiro-specific settings
│   ├── mcp.json             # Model Context Protocol configuration
│   └── preferences.json     # Kiro preferences and behavior settings
├── steering/                 # Context and guidance files
│   ├── project-overview.md  # High-level project understanding
│   ├── architecture.md      # Technical architecture guide
│   ├── development.md       # Development workflow and standards
│   ├── deployment.md        # Deployment procedures and guidelines
│   └── troubleshooting.md   # Common issues and solutions
├── hooks/                   # Automated agent hooks
│   ├── test-on-save.json   # Run tests when files are saved
│   ├── lint-on-commit.json # Lint code before commits
│   └── deploy-check.json   # Pre-deployment validation
└── specs/                   # Feature specifications
    ├── voice-commerce.md    # Voice commerce feature spec
    ├── payment-system.md    # Payment processing spec
    └── i18n-support.md      # Internationalization spec
```

## 🔧 Configuration Files

### MCP Configuration (`settings/mcp.json`)
Model Context Protocol settings for external integrations and tools.

### Preferences (`settings/preferences.json`)
Kiro behavior preferences specific to this project.

### Steering Files (`steering/`)
Context files that provide Kiro with project-specific knowledge and guidelines.

### Hooks (`hooks/`)
Automated workflows that trigger based on development events.

### Specifications (`specs/`)
Detailed feature specifications for complex implementations.

## 📖 Usage

These files help Kiro understand:
- Project architecture and patterns
- Development workflows and standards
- Deployment procedures
- Common troubleshooting scenarios
- Feature specifications and requirements

## 🔄 Maintenance

Keep these files updated as the project evolves to ensure Kiro has current context and can provide accurate assistance.