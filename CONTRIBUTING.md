# Contributing to Stormaxe AI Video System

Thank you for your interest in contributing to Stormaxe AI!

---

## Development Setup

```bash
# Clone and install
git clone https://github.com/geniusdapeng-collab/StormaxeAIVideoSystem.git
cd StormaxeAIVideoSystem
npm install

# Run tests
npm test

# Run in development mode
npm run dev
```

---

## Code Standards

### JavaScript Style
- Use **ES modules** (ESM) syntax
- 2-space indentation, no tabs
- Maximum line length: 100 characters
- Use `const` / `let`, never `var`
- Always handle errors explicitly — no silent catches

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add new storyboard template
fix(director): correct camera angle interpolation
docs(readme): update installation instructions
refactor(pipeline): extract quality gate to standalone module
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "quality gate"
```

---

## Pull Request Process

1. **Fork** the repository and create a feature branch from `sprint/default`
2. **Write tests** for any new functionality
3. **Ensure all tests pass** before submitting a PR
4. **Update documentation** for any API changes
5. **Submit a PR** with a clear description of the changes
6. **Reference issues** using `#issue-number` syntax

---

## Security

- **Never commit API keys, tokens, or credentials** — use environment variables
- Run the security gate before pushing: `./workspace/scripts/github-publish.sh`
- Report security vulnerabilities to the maintainers directly via private channels

---

## Code of Conduct

We are committed to a welcoming and respectful community. All contributors are expected to follow our code of conduct.

---

## Questions?

Open an issue for bugs, feature requests, or general questions.
